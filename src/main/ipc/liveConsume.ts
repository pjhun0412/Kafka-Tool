import type { BrowserWindow } from "electron";
import type { Consumer } from "kafkajs";
import { createKafka } from "../kafkaClient.js";
import { toConsumedMessage } from "../messageMapper.js";
import { getProfile, readPreferences } from "../storage.js";
import type { StartConsumeRequest } from "../../shared/types.js";
import {
  consumeKey,
  isBeforeOffset,
  kafkaToolConsumerGroupId,
  shutdownConsumer
} from "./consumeUtils.js";
import type { LiveRecorderRegistry } from "./liveRecorder.js";

type StartLiveConsumeParams = {
  request: StartConsumeRequest;
  activeConsumers: Map<string, Consumer>;
  liveRecorders: LiveRecorderRegistry;
  getWindow: () => BrowserWindow | null;
  sendConsumeError: (error: unknown) => void;
};

export async function startLiveConsume({
  request,
  activeConsumers,
  liveRecorders,
  getWindow,
  sendConsumeError
}: StartLiveConsumeParams) {
  const consumerId = request.consumerId ?? "default";
  const key = consumeKey(request.serverId, request.topic, consumerId);
  const recorder = await liveRecorders.start(key, request);
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const groupId = kafkaToolConsumerGroupId("live", [request.serverId, request.topic, consumerId]);
  const consumer = kafka.consumer({ groupId });
  const admin = kafka.admin();
  activeConsumers.set(key, consumer);

  try {
    await admin.connect();
    const liveStartOffsets = new Map(
      (await admin.fetchTopicOffsets(request.topic))
        .filter((item) => request.partition === undefined || item.partition === request.partition)
        .map((item) => [item.partition, item.offset])
    );
    await admin.disconnect();

    await consumer.connect();
    await consumer.subscribe({ topic: request.topic, fromBeginning: request.fromBeginning });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (request.partition !== undefined && partition !== request.partition) {
          return;
        }
        if (isBeforeOffset(message.offset, liveStartOffsets.get(partition))) {
          return;
        }
        const payload = {
          ...await toConsumedMessage(profile, topic, partition, message, manualSchema),
          serverId: request.serverId,
          consumerId
        };
        liveRecorders.write(key, payload);
        getWindow()?.webContents.send("kafka:consume-message", payload);
      }
    }).catch((error) => {
      activeConsumers.delete(key);
      liveRecorders.close(key);
      void shutdownConsumer(consumer);
      sendConsumeError(error);
    });
    setTimeout(() => {
      for (const [partition, offset] of liveStartOffsets) {
        try {
          consumer.seek({ topic: request.topic, partition, offset });
        } catch {
          // The offset filter above still prevents old messages from reaching the renderer.
        }
      }
    }, 0);
  } catch (error) {
    activeConsumers.delete(key);
    liveRecorders.close(key);
    await admin.disconnect().catch(() => undefined);
    await shutdownConsumer(consumer);
    sendConsumeError(error);
    throw error;
  }

  return { liveRecordPath: recorder?.path };
}
