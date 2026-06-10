import { createKafka } from "../kafkaClient.js";
import { getProfile, readPreferences } from "../storage.js";
import type {
  ConsumeOffsetRequest,
  ConsumeOffsetResult
} from "../../shared/types.js";
import { kafkaToolConsumerGroupId } from "./consumeUtils.js";
import { runOffsetConsumer } from "./offsetConsumerRunner.js";
import { resolveOffsetWindow } from "./offsetWindow.js";

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
  const limit = Math.max(1, Number(request.limit) || 10);
  let offsetWindow = resolveOffsetWindow(request, limit);

  const admin = kafka.admin();
  await admin.connect();
  try {
    const offsets = await admin.fetchTopicOffsets(request.topic);
    const partitionOffset = offsets.find((offset) => offset.partition === request.partition);
    offsetWindow = resolveOffsetWindow(request, limit, partitionOffset);
  } finally {
    await admin.disconnect();
  }

  if (offsetWindow.expectedMessageCount <= 0) {
    return { messages: [], endOffsetExclusive: offsetWindow.endExclusive?.toString() };
  }

  return await runOffsetConsumer({
    consumer,
    profile,
    request,
    manualSchema,
    offsetWindow,
    limit
  });
}
