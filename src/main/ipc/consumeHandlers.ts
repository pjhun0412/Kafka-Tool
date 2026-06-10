import { BrowserWindow, ipcMain } from "electron";
import type { Consumer } from "kafkajs";
import {
  consumeOffsetBatch,
  consumeTimeRange
} from "./consumeQueries.js";
import { startLiveConsume } from "./liveConsume.js";
import type { createLiveRecorderRegistry } from "./liveRecorder.js";
import { produceMessages } from "./produceMessages.js";
import type {
  ConsumeOffsetRequest,
  ConsumeOffsetResult,
  ConsumeTimeRangeRequest,
  ProduceRequest,
  ProducedMessage,
  StartConsumeRequest,
  StopConsumeRequest
} from "../../shared/types.js";

type LiveRecorderRegistry = ReturnType<typeof createLiveRecorderRegistry>;

type ConsumeHandlerParams = {
  activeConsumers: Map<string, Consumer>;
  getWindow: () => BrowserWindow | null;
  liveRecorders: LiveRecorderRegistry;
  sendConsumeError: (error: unknown) => void;
  stopActiveConsumer: (request?: StopConsumeRequest) => Promise<void>;
};

export function registerConsumeHandlers({
  activeConsumers,
  getWindow,
  liveRecorders,
  sendConsumeError,
  stopActiveConsumer
}: ConsumeHandlerParams) {
  ipcMain.handle("kafka:produce", async (_event, request: ProduceRequest): Promise<ProducedMessage[]> => {
    return produceMessages(request);
  });

  ipcMain.handle("kafka:consume-offset", async (_event, request: ConsumeOffsetRequest): Promise<ConsumeOffsetResult> => {
    return consumeOffsetBatch(request);
  });

  ipcMain.handle("kafka:consume-time-range", async (_event, request: ConsumeTimeRangeRequest) => {
    return consumeTimeRange(request);
  });

  ipcMain.handle("kafka:consume-stop", async (_event, request?: StopConsumeRequest) => {
    await stopActiveConsumer(request);
  });

  ipcMain.handle("kafka:consume-start", async (_event, request: StartConsumeRequest) => {
    const consumerId = request.consumerId ?? "default";
    await stopActiveConsumer({ serverId: request.serverId, topic: request.topic, consumerId });
    return startLiveConsume({
      request,
      activeConsumers,
      liveRecorders,
      getWindow,
      sendConsumeError
    });
  });
}
