import type { ConsumedMessage } from "../shared/types";

const messageValuePayloadCache = new WeakMap<ConsumedMessage, { raw: string; value: unknown }>();

export function getMessageValuePayload(message: ConsumedMessage): unknown {
  if (message.decoded?.value !== undefined) return message.decoded.value;
  const cached = messageValuePayloadCache.get(message);
  if (cached?.raw === message.value) return cached.value;

  let value: unknown = null;
  if (message.value && typeof message.value === "string") {
    try {
      value = JSON.parse(message.value);
    } catch {
      value = null;
    }
  }
  messageValuePayloadCache.set(message, { raw: message.value, value });
  return value;
}

export function collectValuePaths(source: unknown, prefix = "", result = new Set<string>()) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return result;
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      collectValuePaths(value, path, result);
    } else if (!Array.isArray(value)) {
      result.add(path);
    }
  }
  return result;
}

export function collectMessageValuePaths(messages: ConsumedMessage[], sampleSize: number, maxPaths: number) {
  const paths = new Set<string>();
  for (const message of messages.slice(0, sampleSize)) {
    collectValuePaths(getMessageValuePayload(message), "", paths);
    if (paths.size >= maxPaths) break;
  }
  return Array.from(paths).slice(0, maxPaths).sort((left, right) => left.localeCompare(right));
}

export function readValuePath(source: unknown, path: string) {
  if (!source || typeof source !== "object") return "";
  let current: unknown = source;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return "";
    current = (current as Record<string, unknown>)[segment];
  }
  if (current === null || current === undefined) return "";
  if (typeof current === "object") return JSON.stringify(current);
  return String(current);
}
