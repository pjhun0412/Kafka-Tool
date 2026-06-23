import type { Consumer } from "kafkajs";
import { toConsumedMessage } from "../messageMapper.js";
import type {
  ConsumedMessage,
  ConsumeOffsetRequest,
  ManualAvroSchema,
  ServerProfile
} from "../../shared/types.js";
import { shutdownConsumer } from "./consumeUtils.js";
import type { OffsetWindow } from "./offsetWindow.js";

const OFFSET_CONSUME_EMPTY_IDLE_TIMEOUT_MS = 3500;
const OFFSET_CONSUME_ACTIVE_IDLE_TIMEOUT_MS = 700;

type OffsetConsumerRunnerParams = {
  consumer: Consumer;
  profile: ServerProfile;
  request: ConsumeOffsetRequest;
  manualSchema?: ManualAvroSchema;
  offsetWindow: OffsetWindow;
  limit: number;
};

export async function runOffsetConsumer({
  consumer,
  profile,
  request,
  manualSchema,
  offsetWindow,
  limit
}: OffsetConsumerRunnerParams) {
  const messages: ConsumedMessage[] = [];
  let settled = false;

  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<{ messages: ConsumedMessage[]; endOffsetExclusive?: string }>((resolve, reject) => {
    let idleTimeout: NodeJS.Timeout | null = null;

    const resetIdleTimeout = () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = setTimeout(
        finish,
        messages.length > 0 ? OFFSET_CONSUME_ACTIVE_IDLE_TIMEOUT_MS : OFFSET_CONSUME_EMPTY_IDLE_TIMEOUT_MS
      );
    };

    const cleanup = async () => {
      if (idleTimeout) clearTimeout(idleTimeout);
      await shutdownConsumer(consumer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      const result = {
        messages: [...messages],
        endOffsetExclusive: offsetWindow.endExclusive?.toString()
      };
      void cleanup().finally(() => resolve(result));
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      void cleanup().finally(() => reject(error));
    };

    const timeout = setTimeout(finish, Math.max(8000, Math.min(120000, limit * 10)));

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (partition !== request.partition) return;
        resetIdleTimeout();
        if (offsetWindow.endExclusive !== null && /^\d+$/.test(message.offset) && BigInt(message.offset) >= offsetWindow.endExclusive) {
          finish();
          return;
        }
        messages.push(await toConsumedMessage(profile, topic, partition, message, manualSchema));
        if (messages.length >= offsetWindow.expectedMessageCount) {
          finish();
        }
      }
    }).catch(fail);

    setTimeout(() => {
      try {
        consumer.seek({ topic: request.topic, partition: request.partition, offset: offsetWindow.seekOffset });
        resetIdleTimeout();
      } catch (error) {
        fail(error);
      }
    }, 0);
  });
}
