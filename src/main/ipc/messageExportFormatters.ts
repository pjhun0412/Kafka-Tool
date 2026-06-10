import type { ConsumedMessage } from "../../shared/types.js";
import { defaultPreferences } from "../storage.js";

export function csvValue(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export function formatMessagesCsv(messages: ConsumedMessage[]) {
  const header = ["topic", "partition", "offset", "timestamp", "key", "value", "headers"];
  const rows = messages.map((message) => [
    message.topic,
    message.partition,
    message.offset,
    message.timestamp,
    message.key,
    message.value,
    JSON.stringify(message.headers)
  ].map(csvValue).join(","));
  return [header.join(","), ...rows].join("\n");
}

export function formatMessageLog(messages: ConsumedMessage[], template?: string) {
  const lineTemplate = template?.trim() || defaultPreferences.exportFormatTemplate || "{timestamp} {topic}[{partition}]@{offset} {key} {value}";
  return messages.map((message) => {
    const values: Record<string, string> = {
      topic: message.topic,
      partition: String(message.partition),
      offset: message.offset,
      timestamp: message.timestamp,
      key: message.key,
      value: message.value,
      headers: JSON.stringify(message.headers)
    };
    return lineTemplate.replace(/\{(topic|partition|offset|timestamp|key|value|headers)\}/g, (_match: string, key: string) => values[key] ?? "");
  }).join("\n");
}

export function formatMessageLogLine(message: ConsumedMessage, template?: string) {
  return formatMessageLog([message], template);
}

export function formatMessageExportContent(request: {
  format: "json" | "csv" | "log";
  topic: string;
  messages: ConsumedMessage[];
  template?: string;
}) {
  if (request.format === "csv") return formatMessagesCsv(request.messages);
  if (request.format === "log") return formatMessageLog(request.messages, request.template);
  return JSON.stringify({
    exportedAt: new Date().toISOString(),
    topic: request.topic,
    count: request.messages.length,
    messages: request.messages
  }, null, 2);
}
