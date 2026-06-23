import { RAW_PAYLOAD_BASE64_LIMIT_BYTES, type ConsumedMessage, type MessageExportPayloadOptions } from "../../shared/types.js";
import { defaultPreferences } from "../storage.js";

export function csvValue(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function getExportValuePayload(message: ConsumedMessage): unknown {
  if (message.decoded?.value !== undefined) return message.decoded.value;
  if (!message.value) return null;
  try {
    return JSON.parse(message.value) as unknown;
  } catch {
    return null;
  }
}

function readValuePath(source: unknown, path: string) {
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

function getBytesFromBase64(value?: string) {
  return value ? Buffer.from(value, "base64") : Buffer.alloc(0);
}

function getFallbackBytes(value: string) {
  return Buffer.from(value, "utf8");
}

function getPayloadBytes(message: ConsumedMessage, target: "key" | "value") {
  if (target === "key") return message.rawKeyBase64 ? getBytesFromBase64(message.rawKeyBase64) : getFallbackBytes(message.key);
  return message.rawValueBase64 ? getBytesFromBase64(message.rawValueBase64) : getFallbackBytes(message.value);
}

function isRawPayloadOmitted(message: ConsumedMessage, target: "key" | "value") {
  return target === "key"
    ? Boolean(message.rawKeyTruncated && !message.rawKeyBase64)
    : Boolean(message.rawValueTruncated && !message.rawValueBase64);
}

function formatByteCount(bytes: number) {
  return `${bytes.toLocaleString()} B`;
}

function getRawOmittedText(message: ConsumedMessage, target: "key" | "value") {
  const bytes = target === "key" ? message.rawKeyBytes : message.rawValueBytes;
  return `Raw ${target} bytes are not retained (${formatByteCount(bytes ?? 0)} exceeds ${formatByteCount(RAW_PAYLOAD_BASE64_LIMIT_BYTES)} limit).`;
}

function formatHex(bytes: Buffer) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(" ");
}

function decodeText(bytes: Buffer, fallback: string, encoding: MessageExportPayloadOptions["payloadEncoding"]) {
  if (bytes.length === 0) return "";
  try {
    return new TextDecoder(encoding ?? "utf-8", { fatal: false }).decode(bytes);
  } catch {
    return fallback;
  }
}

export function formatExportPayload(message: ConsumedMessage, target: "key" | "value", options?: MessageExportPayloadOptions) {
  const format = target === "key" ? options?.keyFormat ?? "text" : options?.valueFormat ?? "json";
  const fallback = target === "key" ? message.key : message.value;
  if ((format === "hex" || format === "base64") && isRawPayloadOmitted(message, target)) {
    return getRawOmittedText(message, target);
  }
  const bytes = getPayloadBytes(message, target);
  if (format === "hex") return formatHex(bytes);
  if (format === "base64") return bytes.length > 0 ? bytes.toString("base64") : "";
  if (format === "json" && target === "value") {
    if (message.decoded?.value !== undefined) return JSON.stringify(message.decoded.value);
    return fallback;
  }
  return decodeText(bytes, fallback, options?.payloadEncoding);
}

export function formatExportMessage(message: ConsumedMessage, options?: MessageExportPayloadOptions): ConsumedMessage {
  return {
    ...message,
    key: formatExportPayload(message, "key", options),
    value: formatExportPayload(message, "value", options)
  };
}

export function formatMessagesCsv(messages: ConsumedMessage[], options?: MessageExportPayloadOptions) {
  return [formatMessageCsvHeader(options), ...messages.map((message) => formatMessageCsvLine(message, options))].join("\n");
}

export function formatMessageCsvLine(message: ConsumedMessage, options?: MessageExportPayloadOptions) {
  const exportMessage = formatExportMessage(message, options);
  const valueColumnPaths = options?.valueColumnPaths ?? [];
  const valuePayload = valueColumnPaths.length > 0 ? getExportValuePayload(message) : null;
  return [
    exportMessage.topic,
    exportMessage.partition,
    exportMessage.offset,
    exportMessage.timestamp,
    exportMessage.key,
    exportMessage.value,
    JSON.stringify(exportMessage.headers),
    ...valueColumnPaths.map((path) => readValuePath(valuePayload, path))
  ].map(csvValue).join(",");
}

export function formatMessageCsvHeader(options?: MessageExportPayloadOptions) {
  return ["topic", "partition", "offset", "timestamp", "key", "value", "headers", ...(options?.valueColumnPaths ?? []).map((path) => `value.${path}`)].join(",");
}

export function formatMessageLog(messages: ConsumedMessage[], template?: string, options?: MessageExportPayloadOptions) {
  const lineTemplate = template?.trim() || defaultPreferences.exportFormatTemplate || "{timestamp} {topic}[{partition}]@{offset} {key} {value}";
  return messages.map((message) => {
    const exportMessage = formatExportMessage(message, options);
    const values: Record<string, string> = {
      topic: exportMessage.topic,
      partition: String(exportMessage.partition),
      offset: exportMessage.offset,
      timestamp: exportMessage.timestamp,
      key: exportMessage.key,
      value: exportMessage.value,
      headers: JSON.stringify(exportMessage.headers)
    };
    return lineTemplate.replace(/\{(topic|partition|offset|timestamp|key|value|headers)\}/g, (_match: string, key: string) => values[key] ?? "");
  }).join("\n");
}

export function formatMessageLogLine(message: ConsumedMessage, template?: string, options?: MessageExportPayloadOptions) {
  return formatMessageLog([message], template, options);
}

export function formatMessageExportContent(request: {
  format: "json" | "csv" | "log";
  topic: string;
  messages: ConsumedMessage[];
  template?: string;
  payloadOptions?: MessageExportPayloadOptions;
}) {
  if (request.format === "csv") return formatMessagesCsv(request.messages, request.payloadOptions);
  if (request.format === "log") return formatMessageLog(request.messages, request.template, request.payloadOptions);
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    topic: request.topic,
    count: request.messages.length,
    messages: request.messages.map((message) => formatExportMessage(message, request.payloadOptions))
  }, null, 2);
}
