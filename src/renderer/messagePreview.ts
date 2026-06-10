import { RAW_PAYLOAD_BASE64_LIMIT_BYTES, type ConsumedMessage } from "../shared/types";
import type { MessagePayloadFormat, MessagePayloadTarget, MessagePreviewEncoding, MessagePreviewMode } from "./uiTypes";

const textEncoder = new TextEncoder();

function getFallbackBytes(value: string) {
  return textEncoder.encode(value);
}

function getBytesFromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getRawPayloadBytes(message: ConsumedMessage | null, target: MessagePayloadTarget) {
  if (!message) return new Uint8Array();
  if (target === "key") return message.rawKeyBase64 ? getBytesFromBase64(message.rawKeyBase64) : getFallbackBytes(message.key ?? "");
  if (target === "value") return message.rawValueBase64 ? getBytesFromBase64(message.rawValueBase64) : getFallbackBytes(message.value ?? "");
  return getFallbackBytes(getStructuredPayloadText(message, target, false));
}

function formatByteCount(bytes: number) {
  return `${bytes.toLocaleString()} B`;
}

function getRawOmittedText(message: ConsumedMessage | null, target: "key" | "value") {
  const bytes = target === "key" ? message?.rawKeyBytes : message?.rawValueBytes;
  return `Raw ${target} bytes are not retained (${formatByteCount(bytes ?? 0)} exceeds ${formatByteCount(RAW_PAYLOAD_BASE64_LIMIT_BYTES)} limit). Use Text view or export a smaller range.`;
}

function isRawOmitted(message: ConsumedMessage | null, target: MessagePayloadTarget) {
  if (target === "key") return Boolean(message?.rawKeyTruncated && !message.rawKeyBase64);
  if (target === "value") return Boolean(message?.rawValueTruncated && !message.rawValueBase64);
  return false;
}

function decodeText(bytes: Uint8Array, fallback: string, encoding: MessagePreviewEncoding) {
  if (bytes.length === 0) return "";
  try {
    return new TextDecoder(encoding, { fatal: false }).decode(bytes);
  } catch {
    return fallback;
  }
}

export function formatPreviewText(message: ConsumedMessage | null, target: MessagePayloadTarget, encoding: MessagePreviewEncoding) {
  return decodeText(getRawPayloadBytes(message, target), getStructuredPayloadText(message, target, false), encoding);
}

export function formatPreviewHex(message: ConsumedMessage | null, target: MessagePayloadTarget) {
  if (isRawOmitted(message, target)) return getRawOmittedText(message, target as "key" | "value");
  const bytes = getRawPayloadBytes(message, target);
  if (bytes.length === 0) return "";
  const lines: string[] = [];
  for (let index = 0; index < bytes.length; index += 16) {
    const chunk = bytes.slice(index, index + 16);
    lines.push(Array.from(chunk)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" "));
  }
  return lines.join("\n");
}

export function formatPreviewBase64(message: ConsumedMessage | null, target: MessagePayloadTarget) {
  if (isRawOmitted(message, target)) return getRawOmittedText(message, target as "key" | "value");
  if (target === "key" && message?.rawKeyBase64) return message.rawKeyBase64;
  if (target === "value" && message?.rawValueBase64) return message.rawValueBase64;
  const bytes = getRawPayloadBytes(message, target);
  if (bytes.length === 0) return "";
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(index, index + chunkSize));
  }
  return btoa(binary);
}

export function getStructuredPayloadText(message: ConsumedMessage | null, target: MessagePayloadTarget, pretty: boolean) {
  if (!message) return "";
  const spacing = pretty ? 2 : 0;
  if (target === "key") return message.key ?? "";
  if (target === "value") {
    return message.decoded?.value !== undefined
      ? JSON.stringify(message.decoded.value, null, spacing)
      : message.value ?? "";
  }
  if (target === "headers") return JSON.stringify(message.headers ?? {}, null, spacing);
  return JSON.stringify({
    topic: message.topic,
    partition: message.partition,
    offset: message.offset,
    timestamp: message.timestamp,
    key: message.key,
    value: message.decoded?.value ?? message.value,
    headers: message.headers
  }, null, spacing);
}

export function getMessagePreviewMetadata(message: ConsumedMessage | null) {
  if (!message) return "";
  const valueBytes = message.rawValueBytes ?? getRawPayloadBytes(message, "value").length;
  const keyBytes = message.rawKeyBytes ?? getRawPayloadBytes(message, "key").length;
  const headerCount = Object.keys(message.headers ?? {}).length;
  const decoded = message.decoded
    ? [
        `decoded.format: ${message.decoded.format}`,
        `decoded.source: ${message.decoded.source ?? "-"}`,
        `decoded.schemaId: ${message.decoded.schemaId ?? "-"}`,
        `decoded.encoding: ${message.decoded.encoding ?? "-"}`,
        `decoded.error: ${message.decoded.error ?? "-"}`
      ]
    : ["decoded: none"];

  return [
    `topic: ${message.topic}`,
    `partition: ${message.partition}`,
    `offset: ${message.offset}`,
    `timestamp: ${message.timestamp}`,
    `key.bytes: ${formatByteCount(keyBytes)}`,
    `value.bytes: ${formatByteCount(valueBytes)}`,
    `key.rawRetained: ${message.rawKeyTruncated ? "no" : "yes"}`,
    `value.rawRetained: ${message.rawValueTruncated ? "no" : "yes"}`,
    `value.characters: ${message.value.length.toLocaleString()}`,
    `headers.count: ${headerCount}`,
    ...decoded
  ].join("\n");
}

export function formatMessagePayload(message: ConsumedMessage | null, target: MessagePayloadTarget, format: MessagePreviewMode, encoding: MessagePreviewEncoding, pretty = false) {
  if (!message) return "";
  if (format === "metadata") return getMessagePreviewMetadata(message);
  if (format === "hex") return formatPreviewHex(message, target);
  if (format === "base64") return formatPreviewBase64(message, target);
  if (format === "text") return formatPreviewText(message, target, encoding);
  return getStructuredPayloadText(message, target, pretty);
}

export function getGridPayloadPreview(message: ConsumedMessage, target: MessagePayloadTarget, format: MessagePayloadFormat, encoding: MessagePreviewEncoding) {
  return formatMessagePayload(message, target, format, encoding, false);
}
