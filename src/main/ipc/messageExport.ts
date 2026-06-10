import { BrowserWindow, dialog, ipcMain } from "electron";
import { createWriteStream } from "node:fs";
import { writeFile } from "node:fs/promises";
import type {
  ConsumeOffsetRequest,
  ConsumeOffsetResult,
  ConsumedMessage,
  MessageExportRequest,
  OffsetMessageExportRequest
} from "../../shared/types.js";
import { defaultPreferences } from "../storage.js";
import { sanitizeFileName } from "../kafkaUtils.js";

type MessageExportIpcParams = {
  getWindow: () => BrowserWindow | null;
  consumeOffsetBatch: (request: ConsumeOffsetRequest) => Promise<ConsumeOffsetResult>;
  nextOffset: (offset: string) => string;
};

function csvValue(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatMessagesCsv(messages: ConsumedMessage[]) {
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

function formatMessageLog(messages: ConsumedMessage[], template?: string) {
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

function formatMessageLogLine(message: ConsumedMessage, template?: string) {
  return formatMessageLog([message], template);
}

export function registerMessageExportIpcHandlers(params: MessageExportIpcParams) {
  ipcMain.handle("messages:export", async (_event, request: MessageExportRequest): Promise<string | null> => {
    const window = params.getWindow();
    if (!window) return null;
    const extension = request.format === "csv" ? "csv" : request.format === "log" ? "log" : "json";
    const result = await dialog.showSaveDialog(window, {
      title: "Export consumed messages",
      defaultPath: `${sanitizeFileName(request.topic)}-${new Date().toISOString().slice(0, 10)}.${extension}`,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    const content = request.format === "csv"
      ? formatMessagesCsv(request.messages)
      : request.format === "log"
        ? formatMessageLog(request.messages, request.template)
        : JSON.stringify({
        exportedAt: new Date().toISOString(),
        topic: request.topic,
        count: request.messages.length,
        messages: request.messages
      }, null, 2);
    await writeFile(result.filePath, content, "utf8");
    return result.filePath;
  });

  ipcMain.handle("messages:export-offset", async (_event, request: OffsetMessageExportRequest): Promise<string | null> => {
    const window = params.getWindow();
    if (!window) return null;
    const extension = request.format === "csv" ? "csv" : request.format === "log" ? "log" : "json";
    const result = await dialog.showSaveDialog(window, {
      title: "Export offset range messages",
      defaultPath: `${sanitizeFileName(request.topic)}-offset-${new Date().toISOString().slice(0, 10)}.${extension}`,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }

    const stream = createWriteStream(result.filePath, { encoding: "utf8" });
    const write = (chunk: string) => new Promise<void>((resolve, reject) => {
      stream.write(chunk, (error) => error ? reject(error) : resolve());
    });
    const totalLimit = Math.max(1, Number(request.limit) || 10);
    const pageSize = 5000;
    let remaining = totalLimit;
    let cursor = request.offset;
    let count = 0;
    let jsonFirst = true;

    try {
      if (request.format === "csv") {
        await write(["topic", "partition", "offset", "timestamp", "key", "value", "headers"].join(",") + "\n");
      } else if (request.format === "json") {
        await write(`{\n  "exportedAt": ${JSON.stringify(new Date().toISOString())},\n  "topic": ${JSON.stringify(request.topic)},\n  "messages": [\n`);
      }

      while (remaining > 0) {
        const batchLimit = Math.min(pageSize, remaining);
        const batch = await params.consumeOffsetBatch({ ...request, offset: cursor, limit: batchLimit });
        const messages = request.order === "desc" ? [...batch.messages].reverse() : batch.messages;
        if (messages.length === 0) break;

        for (const message of messages) {
          if (request.format === "csv") {
            await write([
              message.topic,
              message.partition,
              message.offset,
              message.timestamp,
              message.key,
              message.value,
              JSON.stringify(message.headers)
            ].map(csvValue).join(",") + "\n");
          } else if (request.format === "log") {
            await write(formatMessageLogLine(message, request.template) + "\n");
          } else {
            await write(`${jsonFirst ? "" : ",\n"}    ${JSON.stringify(message)}`);
            jsonFirst = false;
          }
        }

        count += messages.length;
        remaining -= messages.length;
        if (messages.length < batchLimit) break;
        cursor = request.order === "desc"
          ? messages[messages.length - 1].offset
          : params.nextOffset(messages[messages.length - 1].offset);
      }

      if (request.format === "json") {
        await write(`\n  ],\n  "count": ${count}\n}\n`);
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        stream.end((error?: Error | null) => error ? reject(error) : resolve());
      });
    }

    return result.filePath;
  });
}
