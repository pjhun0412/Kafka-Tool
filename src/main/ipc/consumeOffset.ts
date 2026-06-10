import { createKafka } from "../kafkaClient.js";
import { toConsumedMessage } from "../messageMapper.js";
import { getProfile, readPreferences } from "../storage.js";
import type {
  ConsumedMessage,
  ConsumeOffsetRequest,
  ConsumeOffsetResult
} from "../../shared/types.js";
import {
  kafkaToolConsumerGroupId,
  shutdownConsumer
} from "./consumeUtils.js";

export async function consumeOffsetBatch(request: ConsumeOffsetRequest): Promise<ConsumeOffsetResult> {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const consumer = kafka.consumer({
    groupId: kafkaToolConsumerGroupId("offset", [request.serverId, request.topic, request.partition]),
    minBytes: 1,
    maxWaitTimeInMs: 250
  });
  const messages: ConsumedMessage[] = [];
  const limit = Math.max(1, Number(request.limit) || 10);
  let seekOffset = request.offset;
  let endExclusive: bigint | null = null;
  let expectedMessageCount = limit;
  let settled = false;

  const admin = kafka.admin();
  await admin.connect();
  try {
    const offsets = await admin.fetchTopicOffsets(request.topic);
    const partitionOffset = offsets.find((offset) => offset.partition === request.partition);
    if (partitionOffset && /^\d+$/.test(partitionOffset.high) && /^\d+$/.test(partitionOffset.low)) {
      const high = BigInt(partitionOffset.high);
      const low = BigInt(partitionOffset.low);
      if (request.order === "desc") {
        const snapshotEnd = request.endOffsetExclusive && /^\d+$/.test(request.endOffsetExclusive)
          ? (BigInt(request.endOffsetExclusive) < high ? BigInt(request.endOffsetExclusive) : high)
          : high;
        const requestedEnd = /^\d+$/.test(request.offset) ? BigInt(request.offset) : 0n;
        endExclusive = requestedEnd > low ? (requestedEnd < snapshotEnd ? requestedEnd : snapshotEnd) : snapshotEnd;
      } else {
        endExclusive = request.endOffsetExclusive && /^\d+$/.test(request.endOffsetExclusive)
          ? (BigInt(request.endOffsetExclusive) < high ? BigInt(request.endOffsetExclusive) : high)
          : high;
      }

      if (request.order === "desc" && endExclusive !== null) {
        const start = endExclusive > BigInt(limit) ? endExclusive - BigInt(limit) : low;
        seekOffset = (start > low ? start : low).toString();
      } else if (/^\d+$/.test(seekOffset) && BigInt(seekOffset) < low) {
        seekOffset = low.toString();
      }

      const startOffset = /^\d+$/.test(seekOffset) ? BigInt(seekOffset) : low;
      const boundedStart = startOffset > low ? startOffset : low;
      const remaining = endExclusive > boundedStart ? endExclusive - boundedStart : 0n;
      expectedMessageCount = Number(remaining > BigInt(limit) ? BigInt(limit) : remaining);
    }
  } finally {
    await admin.disconnect();
  }

  if (expectedMessageCount <= 0) {
    return { messages: [], endOffsetExclusive: endExclusive?.toString() };
  }

  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<ConsumeOffsetResult>((resolve, reject) => {
    let idleTimeout: NodeJS.Timeout | null = null;

    const resetIdleTimeout = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(finish, messages.length > 0 ? 700 : 1200);
    };

    const cleanup = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      void shutdownConsumer(consumer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        messages: [...messages],
        endOffsetExclusive: endExclusive?.toString()
      });
      cleanup();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
      cleanup();
    };

    const timeout = setTimeout(finish, Math.max(8000, Math.min(120000, limit * 10)));

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (partition !== request.partition) {
          return;
        }
        resetIdleTimeout();
        if (endExclusive !== null && /^\d+$/.test(message.offset) && BigInt(message.offset) >= endExclusive) {
          finish();
          return;
        }
        messages.push(await toConsumedMessage(profile, topic, partition, message, manualSchema));
        if (messages.length >= expectedMessageCount) {
          finish();
        }
      }
    }).catch(fail);

    setTimeout(() => {
      try {
        consumer.seek({ topic: request.topic, partition: request.partition, offset: seekOffset });
        resetIdleTimeout();
      } catch (error) {
        fail(error);
      }
    }, 0);
  });
}
