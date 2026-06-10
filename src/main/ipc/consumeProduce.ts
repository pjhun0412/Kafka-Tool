import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { createHash } from "node:crypto";
import { createWriteStream, type WriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Consumer } from "kafkajs";
import { encodeManualAvro } from "../avroDecoder.js";
import { createKafka } from "../kafkaClient.js";
import { calculateLag, sanitizeFileName } from "../kafkaUtils.js";
import { toConsumedMessage } from "../messageMapper.js";
import { getProfile, readPreferences } from "../storage.js";
import type {
  ConsumedMessage,
  ConsumeOffsetRequest,
  ConsumeOffsetResult,
  ConsumeTimeRangeRequest,
  ProduceRequest,
  ProducedMessage,
  StartConsumeRequest,
  StopConsumeRequest
} from "../../shared/types.js";

type ConsumeProduceServiceParams = {
  getWindow: () => BrowserWindow | null;
  getLiveRecordTitle: () => string;
};

function consumeKey(serverId: string, topic: string, consumerId = "default") {
  return `${serverId}:${topic}:${consumerId}`;
}

function shortHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function kafkaToolConsumerGroupId(kind: "offset" | "time" | "live", parts: Array<string | number | undefined>) {
  return `kafka-tool-${kind}-${shortHash(parts.map((part) => String(part ?? "")).join(":"))}`;
}

async function shutdownConsumer(consumer: Consumer) {
  try {
    await consumer.stop();
  } catch {
    // Consumer may not be running yet.
  }
  try {
    await consumer.disconnect();
  } catch {
    // Nothing else to do during shutdown.
  }
}

function isBeforeOffset(offset: string, startOffset: string | undefined) {
  if (!startOffset || !/^\d+$/.test(offset) || !/^\d+$/.test(startOffset)) {
    return false;
  }
  return BigInt(offset) < BigInt(startOffset);
}

export function nextOffset(offset: string) {
  return (/^\d+$/.test(offset) ? BigInt(offset) + 1n : 0n).toString();
}

export function createConsumeProduceService(params: ConsumeProduceServiceParams) {
  const activeConsumers = new Map<string, Consumer>();
  const activeLiveRecorders = new Map<string, { stream: WriteStream; path: string; count: number }>();

  function sendConsumeError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    params.getWindow()?.webContents.send("kafka:consume-error", message);
  }

  function closeLiveRecorder(key: string) {
    const recorder = activeLiveRecorders.get(key);
    if (!recorder) return;
    activeLiveRecorders.delete(key);
    recorder.stream.end();
  }

  async function createLiveRecorder(request: StartConsumeRequest) {
    const window = params.getWindow();
    if (!request.record || !window) return undefined;
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0")
    ].join("");
    const defaultPath = path.join(
      app.getPath("documents"),
      `${sanitizeFileName(request.topic)}-${timestamp}.jsonl`
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
    const stream = createWriteStream(result.filePath, { encoding: "utf8", flags: "a" });
    stream.on("error", sendConsumeError);
    return {
      path: result.filePath,
      stream,
      count: 0
    };
  }

  function writeLiveRecord(key: string, payload: ConsumedMessage) {
    const recorder = activeLiveRecorders.get(key);
    if (!recorder) return;
    recorder.count += 1;
    recorder.stream.write(`${JSON.stringify(payload)}\n`);
  }

  async function consumeOffsetBatch(request: ConsumeOffsetRequest): Promise<ConsumeOffsetResult> {
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
          closeLiveRecorder(key);
          return consumer;
        })
        .filter((consumer): consumer is Consumer => Boolean(consumer));
      await Promise.all(consumers.map(shutdownConsumer));
      return;
    }

    const consumers = [...activeConsumers.values()];
    for (const key of activeLiveRecorders.keys()) {
      closeLiveRecorder(key);
    }
    activeConsumers.clear();
    await Promise.all(consumers.map(shutdownConsumer));
  }

  function registerIpcHandlers() {
    ipcMain.handle("kafka:produce", async (_event, request: ProduceRequest): Promise<ProducedMessage[]> => {
      const profile = await getProfile(request.serverId);
      const preferences = await readPreferences();
      const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
      const producer = createKafka(profile).producer();
      await producer.connect();
      try {
        const value = encodeManualAvro(profile, request.topic, request.value, manualSchema);
        const result = await producer.send({
          topic: request.topic,
          messages: [
            {
              key: request.key || undefined,
              value,
              headers: request.headers
            }
          ]
        });
        return result.map((item) => ({
          topic: request.topic,
          partition: item.partition,
          offset: item.baseOffset
        }));
      } finally {
        await producer.disconnect();
      }
    });

    ipcMain.handle("kafka:consume-offset", async (_event, request: ConsumeOffsetRequest): Promise<ConsumeOffsetResult> => {
      return consumeOffsetBatch(request);
    });

    ipcMain.handle("kafka:consume-time-range", async (_event, request: ConsumeTimeRangeRequest): Promise<ConsumedMessage[]> => {
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
    });

    ipcMain.handle("kafka:consume-stop", async (_event, request?: StopConsumeRequest) => {
      await stopActiveConsumer(request);
    });

    ipcMain.handle("kafka:consume-start", async (_event, request: StartConsumeRequest) => {
      const consumerId = request.consumerId ?? "default";
      await stopActiveConsumer({ serverId: request.serverId, topic: request.topic, consumerId });
      const key = consumeKey(request.serverId, request.topic, consumerId);
      const recorder = await createLiveRecorder(request);
      if (recorder) {
        activeLiveRecorders.set(key, recorder);
      }
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
            writeLiveRecord(key, payload);
            params.getWindow()?.webContents.send("kafka:consume-message", payload);
          }
        }).catch((error) => {
          activeConsumers.delete(key);
          closeLiveRecorder(key);
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
        closeLiveRecorder(key);
        await admin.disconnect().catch(() => undefined);
        await shutdownConsumer(consumer);
        sendConsumeError(error);
        throw error;
      }
      return { liveRecordPath: recorder?.path };
    });
  }

  return {
    consumeOffsetBatch,
    hasActiveConsumers: () => activeConsumers.size > 0,
    registerIpcHandlers,
    stopActiveConsumer
  };
}
