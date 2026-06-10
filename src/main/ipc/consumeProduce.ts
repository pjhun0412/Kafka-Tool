import { BrowserWindow } from "electron";
import type { Consumer } from "kafkajs";
import { consumeOffsetBatch } from "./consumeQueries.js";
import { registerConsumeHandlers } from "./consumeHandlers.js";
import { createLiveRecorderRegistry } from "./liveRecorder.js";
import type { StopConsumeRequest } from "../../shared/types.js";
import {
  consumeKey,
  nextOffset,
  shutdownConsumer
} from "./consumeUtils.js";

export { nextOffset } from "./consumeUtils.js";

type ConsumeProduceServiceParams = {
  getWindow: () => BrowserWindow | null;
  getLiveRecordTitle: () => string;
};

export function createConsumeProduceService(params: ConsumeProduceServiceParams) {
  const activeConsumers = new Map<string, Consumer>();

  function sendConsumeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    params.getWindow()?.webContents.send("kafka:consume-error", message);
  }

  const liveRecorders = createLiveRecorderRegistry({
    getWindow: params.getWindow,
    getLiveRecordTitle: params.getLiveRecordTitle,
    onError: sendConsumeError
  });

  async function stopActiveConsumer(request?: StopConsumeRequest) {
    if (request?.serverId && request.topic) {
      const consumerId = request.consumerId;
      const targets = consumerId
        ? [consumeKey(request.serverId, request.topic, consumerId)]
        : [...activeConsumers.keys()].filter((key) => key.startsWith(`${request.serverId}:${request.topic}:`));
      const consumers = targets
        .map((key) => {
          const consumer = activeConsumers.get(key);
          activeConsumers.delete(key);
          liveRecorders.close(key);
          return consumer;
        })
        .filter((consumer): consumer is Consumer => Boolean(consumer));
      await Promise.all(consumers.map(shutdownConsumer));
      return;
    }

    const consumers = [...activeConsumers.values()];
    liveRecorders.closeAll();
    activeConsumers.clear();
    await Promise.all(consumers.map(shutdownConsumer));
  }

  function registerIpcHandlers() {
    registerConsumeHandlers({
      activeConsumers,
      getWindow: params.getWindow,
      liveRecorders,
      sendConsumeError,
      stopActiveConsumer
    });
  }

  return {
    consumeOffsetBatch,
    hasActiveConsumers: () => activeConsumers.size > 0,
    registerIpcHandlers,
    stopActiveConsumer
  };
}
