import { createKafka } from "../kafkaClient.js";
import { toConsumedMessage } from "../messageMapper.js";
import { getProfile, readPreferences } from "../storage.js";
import type {
  ConsumedMessage,
  ConsumeTimeRangeRequest
} from "../../shared/types.js";
import {
  kafkaToolConsumerGroupId,
  shutdownConsumer
} from "./consumeUtils.js";

export async function consumeTimeRange(request: ConsumeTimeRangeRequest): Promise<ConsumedMessage[]> {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const limit = Math.max(1, Number(request.limit) || 100);
  const messages: ConsumedMessage[] = [];
  const admin = kafka.admin();
  const consumer = kafka.consumer({
    groupId: kafkaToolConsumerGroupId("time", [request.serverId, request.topic, request.partition ?? "all"]),
    minBytes: 1,
    maxWaitTimeInMs: 250
  });
  let settled = false;

  await admin.connect();
  const metadata = await admin.fetchTopicMetadata({ topics: [request.topic] });
  const topic = metadata.topics[0];
  if (!topic) {
    await admin.disconnect();
    throw new Error("Topic not found.");
  }

  const partitions = topic.partitions
    .map((partition) => partition.partitionId)
    .filter((partition) => request.partition === undefined || partition === request.partition);
  const offsets = await admin.fetchTopicOffsetsByTimestamp(request.topic, request.startTimestamp);
  const startOffsets = new Map(offsets.map((offset) => [offset.partition, offset.offset]));
  await admin.disconnect();

  if (partitions.length === 0) {
    return [];
  }

  const seekablePartitions = partitions.filter((partition) => {
    const offset = startOffsets.get(partition);
    return offset !== undefined && offset !== "-1" && /^\d+$/.test(offset);
  });
  if (seekablePartitions.length === 0) {
    return [];
  }

  const completed = new Set<number>();
  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<ConsumedMessage[]>((resolve, reject) => {
    let idleTimeout: NodeJS.Timeout | null = null;

    const resetIdleTimeout = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(finish, messages.length > 0 ? 900 : 1500);
    };

    const cleanup = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      void shutdownConsumer(consumer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve([...messages].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)));
      cleanup();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
      cleanup();
    };

    const timeout = setTimeout(finish, 15000);

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!seekablePartitions.includes(partition)) {
          return;
        }
        resetIdleTimeout();

        const timestamp = Number(message.timestamp);
        if (timestamp > request.endTimestamp) {
          completed.add(partition);
          if (completed.size >= seekablePartitions.length) {
            finish();
          }
          return;
        }

        if (timestamp >= request.startTimestamp) {
          messages.push(await toConsumedMessage(profile, topic, partition, message, manualSchema));
          if (messages.length >= limit) {
            finish();
          }
        }
      }
    }).catch(fail);

    setTimeout(() => {
      try {
        for (const partition of seekablePartitions) {
          consumer.seek({
            topic: request.topic,
            partition,
            offset: startOffsets.get(partition) ?? "0"
          });
        }
        resetIdleTimeout();
      } catch (error) {
        fail(error);
      }
    }, 0);
  });
}
