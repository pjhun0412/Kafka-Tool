import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveMapPoint } from "../shared/types";
import {
  createVehicleIcon,
  escapeHtml,
  formatSpeed,
  getLatLng,
  getPointHeading,
  interpolateHeading,
  markerColor,
  type TrackingMode,
  type VehicleState
} from "./mapViewerVehicles";
import "./styles/map-viewer.css";

const MAX_TRAIL = 80;
const DEFAULT_MOVE_DURATION_MS = 850;
const MIN_MOVE_DURATION_MS = 300;
const MAX_MOVE_DURATION_MS = 1200;
const TRAIL_GAP_METERS = 250;
const FOLLOW_CENTER_INTERVAL_MS = 48;
const vehicles = new Map<string, VehicleState>();

let selectedId = "";
let trackingMode: TrackingMode = "selected";
let trailsVisible = true;
let popupVisible = false;
let lastUpdateAt = 0;
let lastFollowCenterAt = 0;

const root = document.getElementById("map-viewer");
if (!root) throw new Error("Map Viewer root element was not found.");

root.innerHTML = `
  <div class="map-viewer-shell">
    <header class="map-viewer-topbar">
      <div class="map-viewer-meta">
        <div class="map-status-group">
          <span class="map-viewer-dot"></span>
          <span id="count">0 points</span>
          <span id="status" class="status-pill empty-status"><span class="status-dot"></span><span>No coordinates</span></span>
          <span id="latest" class="last-update">Waiting for coordinates</span>
        </div>
        <div class="map-actions">
          <div class="tracking-group">
            <button id="followSelected" type="button" class="toggle-action active">Selected</button>
            <button id="autoFit" type="button" class="toggle-action">Auto Fit</button>
            <button id="freeMove" type="button" class="toggle-action">Free</button>
          </div>
          <button id="trail" type="button" class="toggle-action active">Trail</button>
          <button id="clear" type="button" class="clear-action">Clear</button>
        </div>
      </div>
    </header>
    <div class="map-viewer-body">
      <main class="map-panel">
        <div id="leafletMap"></div>
        <div id="empty" class="empty">No latitude/longitude coordinates have been detected yet.</div>
        <div id="popup" class="map-popup"></div>
      </main>
      <aside class="vehicle-sidebar">
        <div class="vehicle-sidebar-header">
          <div class="vehicle-sidebar-title">Vehicles</div>
          <div class="vehicle-sidebar-subtitle">Click an item to focus on it.</div>
        </div>
        <div id="vehicleList" class="vehicle-list"></div>
      </aside>
    </div>
  </div>
`;

const mapElement = document.getElementById("leafletMap") as HTMLDivElement;
const emptyEl = document.getElementById("empty") as HTMLDivElement;
const popupEl = document.getElementById("popup") as HTMLDivElement;
const countEl = document.getElementById("count") as HTMLSpanElement;
const statusEl = document.getElementById("status") as HTMLSpanElement;
const latestEl = document.getElementById("latest") as HTMLSpanElement;
const followSelectedButton = document.getElementById("followSelected") as HTMLButtonElement;
const autoFitButton = document.getElementById("autoFit") as HTMLButtonElement;
const freeMoveButton = document.getElementById("freeMove") as HTMLButtonElement;
const trailButton = document.getElementById("trail") as HTMLButtonElement;
const clearButton = document.getElementById("clear") as HTMLButtonElement;
const vehicleListEl = document.getElementById("vehicleList") as HTMLDivElement;

const map = L.map(mapElement, {
  center: [37.5665, 126.978],
  fadeAnimation: false,
  markerZoomAnimation: true,
  zoom: 16,
  zoomControl: true,
  preferCanvas: true
});

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  className: "map-viewer-tile",
  crossOrigin: true,
  maxZoom: 19,
  updateWhenIdle: false,
  updateWhenZooming: true,
  attribution: "&copy; OpenStreetMap"
}).addTo(map);

setTimeout(() => map.invalidateSize(), 0);


function updateVehicleIcon(vehicle: VehicleState, point: LiveMapPoint, heading: number | undefined = getPointHeading(point)) {
  const markerElement = vehicle.marker.getElement();
  const vehicleElement = markerElement?.querySelector<HTMLElement>(".vehicle-marker");
  if (!vehicleElement) {
    vehicle.marker.setIcon(createVehicleIcon(
      heading === undefined ? { ...point, heading: undefined } : { ...point, heading },
      point.id === selectedId
    ));
    return;
  }

  vehicleElement.classList.toggle("selected", point.id === selectedId);
  vehicleElement.classList.toggle("has-heading", heading !== undefined);
  vehicleElement.style.setProperty("--heading", `${heading ?? 0}deg`);
  const labelElement = vehicleElement.querySelector<HTMLElement>(".vehicle-marker-label");
  if (labelElement) {
    labelElement.textContent = point.label || point.id;
  }
}

function appendTrailPoint(vehicle: VehicleState, latLng: L.LatLngTuple) {
  const last = vehicle.trail.at(-1);
  if (!last || last[0] !== latLng[0] || last[1] !== latLng[1]) {
    vehicle.trail.push(latLng);
  }
  if (vehicle.trail.length > MAX_TRAIL) {
    vehicle.trail.splice(0, vehicle.trail.length - MAX_TRAIL);
  }
  vehicle.polyline.setLatLngs(vehicle.trail);
}

function isTrailGap(vehicle: VehicleState, latLng: L.LatLngTuple) {
  const last = vehicle.trail.at(-1);
  if (!last) return false;
  return L.latLng(last).distanceTo(L.latLng(latLng)) > TRAIL_GAP_METERS;
}

function selectedVehicle() {
  return selectedId ? vehicles.get(selectedId) ?? null : null;
}

function setTrackingMode(mode: TrackingMode) {
  trackingMode = mode;
  followSelectedButton.classList.toggle("active", mode === "selected");
  autoFitButton.classList.toggle("active", mode === "fit");
  freeMoveButton.classList.toggle("active", mode === "free");
  updateStatus();
}

function updateStatus() {
  let label = "No coordinates";
  let className = "status-pill empty-status";
  if (vehicles.size > 0) {
    if (trackingMode === "free") {
      label = "Paused";
      className = "status-pill free";
    } else if (trackingMode === "fit") {
      label = "Auto Fit";
      className = "status-pill live";
    } else {
      label = selectedId ? "Follow Selected" : "Live";
      className = "status-pill live";
    }
  }
  statusEl.className = className;
  statusEl.innerHTML = `<span class="status-dot"></span><span>${label}</span>`;

  if (!lastUpdateAt) {
    latestEl.textContent = vehicles.size === 0 ? "Waiting for coordinates" : "Loaded buffered coordinates";
    return;
  }
  const seconds = Math.max(0, Math.floor((Date.now() - lastUpdateAt) / 1000));
  latestEl.textContent = seconds <= 1 ? "Last update just now" : `Last update ${seconds}s ago`;
}

function renderMarkers() {
  for (const vehicle of vehicles.values()) {
    updateVehicleIcon(vehicle, vehicle.point, vehicle.lastHeading);
    vehicle.polyline.setStyle({
      opacity: trailsVisible ? (selectedId && selectedId !== vehicle.point.id ? 0.18 : 0.72) : 0,
      weight: selectedId === vehicle.point.id ? 4 : 2,
      color: markerColor(vehicle.point.id)
    });
  }
}

function closePopup() {
  popupVisible = false;
  popupEl.style.display = "none";
}

function showPopup(point: LiveMapPoint, options: { open?: boolean } = {}) {
  selectedId = point.id;
  if (options.open) popupVisible = true;
  if (!popupVisible) {
    popupEl.style.display = "none";
    renderMarkers();
    renderVehicleList();
    return;
  }

  const meta = point.meta || {};
  const rows = [
    ["Topic", point.topic],
    ["Offset", `${point.partition}:${point.offset}`],
    ["Time", point.timestamp || "-"],
    ["Lat/Lng", `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`],
    ...(Number.isFinite(point.heading) ? [["Heading", `${Number(point.heading).toFixed(1)}${String.fromCharCode(176)}`]] : []),
    ...(formatSpeed(meta.speed) ? [["Speed", `${formatSpeed(meta.speed)} km/h`]] : []),
    ...(meta.drivingMode || meta.driving_mode ? [["Mode", meta.drivingMode || meta.driving_mode]] : []),
    ...(meta.linkId || meta.link_id ? [["Link ID", meta.linkId || meta.link_id]] : [])
  ];

  popupEl.style.display = "block";
  popupEl.innerHTML = `
    <div class="popup-header">
      <div class="popup-title">${escapeHtml(point.label || point.id)}</div>
      <button class="popup-close" type="button" aria-label="Close">x</button>
    </div>
    <div class="popup-grid">
      ${rows.map(([key, value]) => `
        <div class="popup-key">${escapeHtml(key)}</div>
        <div class="popup-value"><code>${escapeHtml(value)}</code></div>
      `).join("")}
    </div>
  `;
  popupEl.querySelector(".popup-close")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closePopup();
  });
  renderMarkers();
  renderVehicleList();
}

function focusVehicle(point: LiveMapPoint, options: { openPopup?: boolean } = {}) {
  setTrackingMode("selected");
  selectedId = point.id;
  map.panTo(getLatLng(point), { animate: true, duration: 0.45 });
  showPopup(point, { open: options.openPopup });
}

function focusVehicleWithoutPopup(point: LiveMapPoint) {
  setTrackingMode("selected");
  selectedId = point.id;
  map.panTo(getLatLng(point), { animate: true, duration: 0.45 });
  closePopup();
  renderMarkers();
  renderVehicleList();
}

function fitAllVehicles() {
  const items = Array.from(vehicles.values());
  if (items.length === 0) return;
  if (items.length === 1) {
    map.panTo(getLatLng(items[0].point), { animate: true, duration: 0.45 });
    return;
  }
  map.fitBounds(items.map((item) => getLatLng(item.point)), {
    animate: true,
    duration: 0.45,
    padding: [72, 72],
    maxZoom: 18
  });
}

function applyTracking() {
  if (trackingMode === "selected") {
    const vehicle = selectedVehicle();
    if (vehicle) {
      const current = vehicle.marker.getLatLng();
      map.panTo([current.lat, current.lng], { animate: true, duration: 0.25 });
    }
    return;
  }
  if (trackingMode === "fit") fitAllVehicles();
}

function animateMarker(vehicle: VehicleState, nextPoint: LiveMapPoint) {
  const previousPoint = vehicle.point;
  const receivedAt = Date.now();
  if (vehicle.animation) {
    cancelAnimationFrame(vehicle.animation);
    vehicle.animation = undefined;
    const current = vehicle.marker.getLatLng();
    appendTrailPoint(vehicle, [current.lat, current.lng]);
  }
  const from = vehicle.marker.getLatLng();
  const to = L.latLng(nextPoint.lat, nextPoint.lng);
  const finalLatLng: L.LatLngTuple = [to.lat, to.lng];
  const shouldResetTrail = isTrailGap(vehicle, finalLatLng);
  const fromHeading = vehicle.lastHeading ?? getPointHeading(previousPoint);
  const toHeading = getPointHeading(nextPoint);
  const duration = vehicle.lastPointAt
    ? Math.min(MAX_MOVE_DURATION_MS, Math.max(MIN_MOVE_DURATION_MS, receivedAt - vehicle.lastPointAt))
    : DEFAULT_MOVE_DURATION_MS;
  vehicle.point = nextPoint;
  vehicle.lastPointAt = receivedAt;
  const start = performance.now();

  function step(now: number) {
    const progress = Math.min(1, (now - start) / duration);
    const lat = from.lat + (to.lat - from.lat) * progress;
    const lng = from.lng + (to.lng - from.lng) * progress;
    const heading = interpolateHeading(fromHeading, toHeading, progress);
    const currentLatLng: L.LatLngTuple = [lat, lng];
    vehicle.marker.setLatLng(currentLatLng);
    vehicle.lastHeading = heading;
    updateVehicleIcon(vehicle, nextPoint, heading);
    vehicle.polyline.setLatLngs(shouldResetTrail ? [currentLatLng] : [...vehicle.trail, currentLatLng]);
    if (
      trackingMode === "selected"
      && selectedId === nextPoint.id
      && (progress === 1 || now - lastFollowCenterAt >= FOLLOW_CENTER_INTERVAL_MS)
    ) {
      lastFollowCenterAt = now;
      map.setView(currentLatLng, map.getZoom(), { animate: false });
    }
    if (progress < 1) {
      vehicle.animation = requestAnimationFrame(step);
      return;
    }
    vehicle.marker.setLatLng(finalLatLng);
    if (shouldResetTrail) {
      vehicle.trail = [finalLatLng];
      vehicle.polyline.setLatLngs(vehicle.trail);
    } else {
      appendTrailPoint(vehicle, finalLatLng);
    }
    vehicle.lastHeading = toHeading;
    updateVehicleIcon(vehicle, nextPoint, toHeading);
    vehicle.animation = undefined;
  }

  vehicle.animation = requestAnimationFrame(step);
}

function upsertVehicle(point: LiveMapPoint) {
  const existing = vehicles.get(point.id);
  if (existing) {
    animateMarker(existing, point);
    return existing;
  }

  const marker = L.marker(getLatLng(point), {
    icon: createVehicleIcon(point, point.id === selectedId),
    keyboard: false,
    riseOnHover: true
  }).addTo(map);
  marker.on("click", () => focusVehicle(point, { openPopup: true }));

  const trail = [getLatLng(point)];
  const polyline = L.polyline(trail, {
    color: markerColor(point.id),
    weight: 2,
    opacity: trailsVisible ? 0.72 : 0
  }).addTo(map);

  const vehicle = { point, marker, trail, polyline };
  vehicle.lastHeading = getPointHeading(point);
  vehicle.lastPointAt = Date.now();
  vehicles.set(point.id, vehicle);
  return vehicle;
}

function renderVehicleList() {
  const items = Array.from(vehicles.values()).sort((left, right) => String(right.point.timestamp).localeCompare(String(left.point.timestamp)));
  vehicleListEl.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (const vehicle of items) {
    const point = vehicle.point;
    const button = document.createElement("button");
    button.type = "button";
    button.className = selectedId === point.id ? "vehicle-item selected" : "vehicle-item";
    button.style.setProperty("--marker-color", markerColor(point.id));

    const speed = formatSpeed(point.meta?.speed);
    const speedValue = speed ? `${speed} km/h` : "";
    const headingValue = Number.isFinite(point.heading) ? `${Number(point.heading).toFixed(0)}${String.fromCharCode(176)}` : "";
    const status = [speedValue, headingValue].filter(Boolean).join(" / ");
    button.innerHTML = `
      <span class="vehicle-color"></span>
      <span class="vehicle-card-body">
        <span class="vehicle-main">
          <span class="vehicle-name">${escapeHtml(point.label || point.id)}</span>
          <span class="vehicle-status">${escapeHtml(status)}</span>
        </span>
        <span class="vehicle-meta">${escapeHtml(point.topic)} [${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}]</span>
      </span>
    `;
    button.addEventListener("click", () => focusVehicleWithoutPopup(point));
    fragment.appendChild(button);
  }
  vehicleListEl.appendChild(fragment);
}

function refreshView() {
  emptyEl.style.display = vehicles.size === 0 ? "grid" : "none";
  countEl.textContent = vehicles.size + (vehicles.size === 1 ? " point" : " points");
  followSelectedButton.classList.toggle("active", trackingMode === "selected");
  autoFitButton.classList.toggle("active", trackingMode === "fit");
  freeMoveButton.classList.toggle("active", trackingMode === "free");
  trailButton.classList.toggle("active", trailsVisible);
  renderMarkers();
  renderVehicleList();
  updateStatus();
}

function addPoints(nextPoints: LiveMapPoint[]) {
  let focusedPoint: LiveMapPoint | null = null;
  for (const point of nextPoints) {
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) continue;
    const id = point.id || `${point.topic}:${point.partition}:${point.offset}`;
    const nextPoint = { ...point, id };
    upsertVehicle(nextPoint);
    lastUpdateAt = Date.now();
    if (nextPoint.focus) focusedPoint = nextPoint;
    if (!selectedId) selectedId = nextPoint.id;
  }

  if (focusedPoint) {
    selectedId = focusedPoint.id;
    setTrackingMode("selected");
    showPopup(focusedPoint);
  } else {
    applyTracking();
  }
  refreshView();
}

followSelectedButton.addEventListener("click", () => {
  setTrackingMode("selected");
  const vehicle = selectedVehicle();
  if (vehicle) focusVehicleWithoutPopup(vehicle.point);
});

autoFitButton.addEventListener("click", () => {
  setTrackingMode("fit");
  fitAllVehicles();
  refreshView();
});

freeMoveButton.addEventListener("click", () => {
  setTrackingMode("free");
  refreshView();
});

trailButton.addEventListener("click", () => {
  trailsVisible = !trailsVisible;
  refreshView();
});

clearButton.addEventListener("click", () => {
  for (const vehicle of vehicles.values()) {
    if (vehicle.animation) cancelAnimationFrame(vehicle.animation);
    vehicle.marker.remove();
    vehicle.polyline.remove();
  }
  vehicles.clear();
  selectedId = "";
  lastUpdateAt = 0;
  closePopup();
  void window.liveMapApi?.clearPoints?.();
  refreshView();
});

map.on("dragstart zoomstart", () => {
  setTrackingMode("free");
  refreshView();
});

popupEl.addEventListener("pointerdown", (event) => event.stopPropagation());
popupEl.addEventListener("click", (event) => event.stopPropagation());
window.setInterval(updateStatus, 1000);

if (window.liveMapApi?.onPoints) {
  window.liveMapApi.onPoints(addPoints);
  if (typeof window.liveMapApi.getPoints === "function") {
    window.liveMapApi.getPoints().then((bufferedPoints) => {
      if (bufferedPoints.length === 0) {
        refreshView();
        return;
      }
      addPoints(bufferedPoints);
    }).catch(() => {
      latestEl.textContent = "Could not load buffered coordinates";
    });
  }
} else {
  latestEl.textContent = "Map bridge is not ready";
  emptyEl.textContent = "Map Viewer could not connect to Kafka Tool. Close this window and open Map again.";
}

refreshView();
