import type { ConsumedMessage, LiveMapPoint } from "../shared/types";
import { getStructuredPayloadText } from "./messagePreview";

export type MapCoordinate = {
  lat: number;
  lng: number;
};

const latitudeKeys = new Set(["lat", "latitude", "gpslat", "gps_lat", "ylat", "y"]);
const longitudeKeys = new Set(["lng", "lon", "long", "longitude", "gpslng", "gps_lng", "gpslon", "gps_lon", "xlng", "x"]);
const headingKeys = new Set(["heading", "bearing", "direction", "azimuth", "course", "angle", "yaw"]);
const mapMetaKeys = new Set([
  "speed",
  "drivingmode",
  "driving_mode",
  "routenm",
  "route_nm",
  "engroutnm",
  "engroutename",
  "linkid",
  "link_id",
  "crossid",
  "cross_id",
  "messagelog",
  "message_log",
  "gpstime",
  "gps_time",
  "movetime",
  "move_time",
  "movedistance",
  "move_distance"
]);
const identityKeys = new Set([
  "id",
  "edgeid",
  "edge_id",
  "vehicleid",
  "vehicle_id",
  "vhclid",
  "vhcl_id",
  "busid",
  "bus_id",
  "deviceid",
  "device_id",
  "obuid",
  "obu_id",
  "terminalid",
  "terminal_id"
]);

function normalizeKey(key: string) {
  return key.replace(/[-\s]/g, "_").toLowerCase();
}

function toCoordinateNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return NaN;
  const trimmed = value.trim();
  if (!trimmed) return NaN;
  return Number(trimmed);
}

function isValidCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function normalizeHeading(value: number) {
  if (!Number.isFinite(value)) return undefined;
  return ((value % 360) + 360) % 360;
}

function findCoordinateInObject(value: Record<string, unknown>): MapCoordinate | null {
  let lat: number | null = null;
  let lng: number | null = null;

  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = normalizeKey(key);
    if (latitudeKeys.has(normalizedKey)) {
      lat = toCoordinateNumber(item);
    }
    if (longitudeKeys.has(normalizedKey)) {
      lng = toCoordinateNumber(item);
    }
  }

  if (lat === null || lng === null || !isValidCoordinate(lat, lng)) return null;
  return { lat, lng };
}

export function findMapCoordinate(value: unknown): MapCoordinate | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const coordinate = findMapCoordinate(item);
      if (coordinate) return coordinate;
    }
    return null;
  }

  const objectValue = value as Record<string, unknown>;
  const directCoordinate = findCoordinateInObject(objectValue);
  if (directCoordinate) return directCoordinate;

  const preferredValues = ["value", "payload", "data", "decoded"];
  for (const key of preferredValues) {
    const coordinate = findMapCoordinate(objectValue[key]);
    if (coordinate) return coordinate;
  }

  for (const item of Object.values(objectValue)) {
    const coordinate = findMapCoordinate(item);
    if (coordinate) return coordinate;
  }
  return null;
}

export function getOpenStreetMapUrl(coordinate: MapCoordinate) {
  return `https://www.openstreetmap.org/?mlat=${coordinate.lat}&mlon=${coordinate.lng}#map=18/${coordinate.lat}/${coordinate.lng}`;
}

function parseJsonPayload(value: string) {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function findIdentity(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const identity = findIdentity(item);
      if (identity) return identity;
    }
    return null;
  }

  const objectValue = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(objectValue)) {
    if (!identityKeys.has(normalizeKey(key))) continue;
    if (typeof item === "string" && item.trim()) return item.trim();
    if (typeof item === "number" && Number.isFinite(item)) return String(item);
  }

  const preferredValues = ["value", "payload", "data", "decoded"];
  for (const key of preferredValues) {
    const identity = findIdentity(objectValue[key]);
    if (identity) return identity;
  }

  for (const item of Object.values(objectValue)) {
    const identity = findIdentity(item);
    if (identity) return identity;
  }
  return null;
}

function findHeading(value: unknown): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const heading = findHeading(item);
      if (heading !== undefined) return heading;
    }
    return undefined;
  }

  const objectValue = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(objectValue)) {
    if (!headingKeys.has(normalizeKey(key))) continue;
    const heading = normalizeHeading(toCoordinateNumber(item));
    if (heading !== undefined) return heading;
  }

  const preferredValues = ["value", "payload", "data", "decoded"];
  for (const key of preferredValues) {
    const heading = findHeading(objectValue[key]);
    if (heading !== undefined) return heading;
  }

  for (const item of Object.values(objectValue)) {
    const heading = findHeading(item);
    if (heading !== undefined) return heading;
  }
  return undefined;
}

function stringifyMapMetaValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function findMapMeta(value: unknown): Record<string, string> {
  const meta: Record<string, string> = {};
  if (!value || typeof value !== "object") return meta;
  if (Array.isArray(value)) {
    for (const item of value) {
      Object.assign(meta, findMapMeta(item));
    }
    return meta;
  }

  const objectValue = value as Record<string, unknown>;
  for (const [key, item] of Object.entries(objectValue)) {
    if (!mapMetaKeys.has(normalizeKey(key))) continue;
    const text = stringifyMapMetaValue(item);
    if (text) meta[key] = text;
  }

  const preferredValues = ["value", "payload", "data", "decoded"];
  for (const key of preferredValues) {
    Object.assign(meta, findMapMeta(objectValue[key]));
  }
  return meta;
}

export function getMessageMapPayload(message: ConsumedMessage) {
  if (message.decoded?.value !== undefined) return message.decoded.value;
  return parseJsonPayload(getStructuredPayloadText(message, "value", false));
}

export function createLiveMapPoint(message: ConsumedMessage, payload: unknown = getMessageMapPayload(message)): LiveMapPoint | null {
  const coordinate = findMapCoordinate(payload);
  if (!coordinate) return null;
  const identity = findIdentity(payload) ?? message.key?.trim() ?? "";
  const fallbackId = `${message.topic}:${message.partition}:${message.offset}`;
  const id = identity || fallbackId;
  return {
    id,
    topic: message.topic,
    partition: message.partition,
    offset: message.offset,
    timestamp: message.timestamp,
    lat: coordinate.lat,
    lng: coordinate.lng,
    heading: findHeading(payload),
    label: identity || message.key?.trim() || fallbackId,
    meta: findMapMeta(payload)
  };
}
