import { BrowserWindow, dialog, ipcMain } from "electron";
import { writeFile } from "node:fs/promises";
import type {
  ConsumeOffsetRequest,
  ConsumeOffsetResult,
  MessageExportRequest,
  OffsetMessageExportRequest
} from "../../shared/types.js";
import { sanitizeFileName } from "../kafkaUtils.js";
import { formatMessageExportContent } from "./messageExportFormatters.js";
import { writeOffsetMessageExport } from "./offsetMessageExport.js";

type MessageExportIpcParams = {
  getWindow: () => BrowserWindow | null;
  consumeOffsetBatch: (request: ConsumeOffsetRequest) => Promise<ConsumeOffsetResult>;
  nextOffset: (offset: string) => string;
};

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
    const content = formatMessageExportContent(request);
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

    await writeOffsetMessageExport({
      filePath: result.filePath,
      request,
      consumeOffsetBatch: params.consumeOffsetBatch,
      nextOffset: params.nextOffset
    });
    return result.filePath;
  });
}
