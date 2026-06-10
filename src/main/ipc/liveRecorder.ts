import { app, dialog, type BrowserWindow } from "electron";
import { createWriteStream, type WriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { sanitizeFileName } from "../kafkaUtils.js";
import type {
  ConsumedMessage,
  StartConsumeRequest
} from "../../shared/types.js";

type LiveRecorder = {
  stream: WriteStream;
  path: string;
  count: number;
};

type LiveRecorderRegistryParams = {
  getWindow: () => BrowserWindow | null;
  getLiveRecordTitle: () => string;
  onError: (error: unknown) => void;
};

function createLiveRecordTimestamp() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0")
  ].join("");
}

export function createLiveRecorderRegistry(params: LiveRecorderRegistryParams) {
  const activeLiveRecorders = new Map<string, LiveRecorder>();

  function close(key: string) {
    const recorder = activeLiveRecorders.get(key);
    if (!recorder) return;
    activeLiveRecorders.delete(key);
    recorder.stream.end();
  }

  function closeAll() {
    for (const key of activeLiveRecorders.keys()) {
      close(key);
    }
  }

  async function start(key: string, request: StartConsumeRequest) {
    const window = params.getWindow();
    if (!request.record || !window) return undefined;
    const defaultPath = path.join(
      app.getPath("documents"),
      `${sanitizeFileName(request.topic)}-${createLiveRecordTimestamp()}.jsonl`
    );
    const result = await dialog.showSaveDialog(window, {
      title: params.getLiveRecordTitle(),
      defaultPath,
      filters: [
        { name: "JSON Lines", extensions: ["jsonl"] },
        { name: "JSON", extensions: ["json"] },
        { name: "All Files", extensions: ["*"] }
      ]
    });
    if (result.canceled || !result.filePath) {
      throw new Error("Live recording canceled.");
    }
    await mkdir(path.dirname(result.filePath), { recursive: true });
    const recorder = {
      path: result.filePath,
      stream: createWriteStream(result.filePath, { encoding: "utf8", flags: "a" }),
      count: 0
    };
    recorder.stream.on("error", params.onError);
    activeLiveRecorders.set(key, recorder);
    return recorder;
  }

  function write(key: string, payload: ConsumedMessage) {
    const recorder = activeLiveRecorders.get(key);
    if (!recorder) return;
    recorder.count += 1;
    recorder.stream.write(`${JSON.stringify(payload)}\n`);
  }

  return {
    close,
    closeAll,
    start,
    write
  };
}

export type LiveRecorderRegistry = ReturnType<typeof createLiveRecorderRegistry>;
