import type { Consumer } from "kafkajs";
import { toConsumedMessage } from "../messageMapper.js";
import type {
  ConsumedMessage,
  ConsumeTimeRangeRequest,
  ManualAvroSchema,
  ServerProfile
} from "../../shared/types.js";
import { shutdownConsumer } from "./consumeUtils.js";

type TimeRangeConsumerRunnerParams = {
  consumer: Consumer;
  profile: ServerProfile;
  request: ConsumeTimeRangeRequest;
  manualSchema?: ManualAvroSchema;
  seekablePartitions: number[];
  startOffsets: Map<number, string>;
  limit: number;
};

export async function runTimeRangeConsumer({
  consumer,
  profile,
  request,
  manualSchema,
  seekablePartitions,
  startOffsets,
  limit
}: TimeRangeConsumerRunnerParams) {
  const messages: ConsumedMessage[] = [];
  const completed = new Set<number>();
  let settled = false;

  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<ConsumedMessage[]>((resolve, reject) => {
    let idleTimeout: NodeJS.Timeout | null = null;

    const resetIdleTimeout = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(finish, messages.length > 0 ? 900 : 1500);
    };

    const cleanup = async () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      await shutdownConsumer(consumer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const result = [...messages].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
      void cleanup().finally(() => resolve(result));
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void cleanup().finally(() => reject(error));
    };

    const timeout = setTimeout(finish, 15000);

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!seekablePartitions.includes(partition)) return;
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
