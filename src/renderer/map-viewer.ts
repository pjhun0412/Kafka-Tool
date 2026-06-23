import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveMapPoint } from "../shared/types";
import "./styles/map-viewer.css";

type TrackingMode = "selected" | "fit" | "free";

type VehicleState = {
  point: LiveMapPoint;
  marker: L.Marker;
  trail: L.LatLngTuple[];
  polyline: L.Polyline;
  animation?: number;
};

const MAX_TRAIL = 80;
const MOVE_DURATION_MS = 650;
const TRAIL_GAP_METERS = 250;
const vehicles = new Map<string, VehicleState>();

let selectedId = "";
let trackingMode: TrackingMode = "selected";
let trailsVisible = true;
let popupVisible = false;
let lastUpdateAt = 0;

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

function escapeHtml(value: unknown) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char] ?? char));
}

function markerColor(id: string) {
  const palette = ["#38bdf8", "#22c55e", "#f59e0b", "#f472b6", "#a78bfa", "#fb7185", "#2dd4bf", "#60a5fa"];
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}

function createVehicleIcon(point: LiveMapPoint, selected: boolean) {
  const color = markerColor(point.id);
  const heading = Number.isFinite(point.heading) ? Number(point.heading) : 0;
  const headingClass = Number.isFinite(point.heading) ? "has-heading" : "";
  const selectedClass = selected ? "selected" : "";
  return L.divIcon({
    className: "vehicle-marker-icon",
    iconSize: [1, 1],
    iconAnchor: [0, 0],
    html: `
      <div class="vehicle-marker ${headingClass} ${selectedClass}" style="--marker-color:${color}; --heading:${heading}deg">
        <div class="vehicle-marker-body">
          <svg class="vehicle-marker-svg" viewBox="0 0 48 88" aria-hidden="true">
            <path class="vehicle-body-shape" d="M24 2c-9.3 0-15.8 5.7-17.1 15L3.3 43.6c-.4 3-.4 6.1 0 9.1L6.9 71C8.2 80.3 14.7 86 24 86s15.8-5.7 17.1-15l3.6-18.3c.6-3 .6-6.1 0-9.1L41.1 17C39.8 7.7 33.3 2 24 2Z" />
            <path class="vehicle-glass" d="M11.2 19.4c1.2-5.3 4.6-8.1 10.2-8.5l-1.8 8.4c-.4 1.8-1.8 3.1-3.6 3.5l-5.6 1.2.8-4.6Zm25.6 0-.8 4.6-5.6-1.2c-1.8-.4-3.2-1.7-3.6-3.5L25 10.9c5.6.4 9 3.2 10.2 8.5Z" />
            <path class="vehicle-glass" d="M12.3 37.1c6.6-2.1 17.1-2.1 23.4 0l-2.3 12.8c-5.3-2.2-13.7-2.2-18.8 0l-2.3-12.8Zm2.1 29.7c5.1 2.3 14.1 2.3 19.2 0l-1.6 8c-.8 4.1-3.6 6.3-8 6.3s-7.2-2.2-8-6.3l-1.6-8Z" />
            <path class="vehicle-shadow-shape" d="M8.9 29.3c3.7-1.7 8.9-2.6 15.1-2.6s11.4.9 15.1 2.6l.9 6.6c-4.5-2.3-10-3.4-16-3.4S12.5 33.6 8 35.9l.9-6.6Zm-.4 29.3c4.8 2.2 10 3.3 15.5 3.3s10.7-1.1 15.5-3.3l-1.1 5.4c-4.2 2.4-9 3.6-14.4 3.6S13.8 66.4 9.6 64l-1.1-5.4Z" />
          </svg>
        </div>
        <div class="vehicle-marker-label">${escapeHtml(point.label || point.id)}</div>
      </div>
    `
  });
}

function getLatLng(point: LiveMapPoint): L.LatLngTuple {
  return [point.lat, point.lng];
}

function formatSpeed(speed: unknown) {
  const speedNumber = Number(speed);
  if (!Number.isFinite(speedNumber)) return "";
  return speedNumber.toFixed(1);
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
    vehicle.marker.setIcon(createVehicleIcon(vehicle.point, vehicle.point.id === selectedId));
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
    if (vehicle) map.panTo(getLatLng(vehicle.point), { animate: true, duration: 0.45 });
    return;
  }
  if (trackingMode === "fit") fitAllVehicles();
}

function animateMarker(vehicle: VehicleState, nextPoint: LiveMapPoint) {
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
  const start = performance.now();

  function step(now: number) {
    const progress = Math.min(1, (now - start) / MOVE_DURATION_MS);
    const eased = 1 - Math.pow(1 - progress, 3);
    const lat = from.lat + (to.lat - from.lat) * eased;
    const lng = from.lng + (to.lng - from.lng) * eased;
    const currentLatLng: L.LatLngTuple = [lat, lng];
    vehicle.marker.setLatLng(currentLatLng);
    vehicle.polyline.setLatLngs(shouldResetTrail ? [currentLatLng] : [...vehicle.trail, currentLatLng]);
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
    vehicle.animation = undefined;
  }

  vehicle.animation = requestAnimationFrame(step);
}

function upsertVehicle(point: LiveMapPoint) {
  const existing = vehicles.get(point.id);
  if (existing) {
    existing.point = point;
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
    map.panTo(getLatLng(focusedPoint), { animate: true, duration: 0.45 });
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
