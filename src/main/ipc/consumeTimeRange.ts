import { createKafka } from "../kafkaClient.js";
import { getProfile, readPreferences } from "../storage.js";
import type {
  ConsumedMessage,
  ConsumeTimeRangeRequest
} from "../../shared/types.js";
import { kafkaToolConsumerGroupId } from "./consumeUtils.js";
import { runTimeRangeConsumer } from "./timeRangeConsumerRunner.js";
import { resolveTimeRangeSeekTargets } from "./timeRangeOffsets.js";

export async function consumeTimeRange(request: ConsumeTimeRangeRequest): Promise<ConsumedMessage[]> {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const limit = Math.max(1, Number(request.limit) || 100);
  const admin = kafka.admin();
  const consumer = kafka.consumer({
    groupId: kafkaToolConsumerGroupId("time", [request.serverId, request.topic, request.partition ?? "all"]),
    minBytes: 1,
    maxWaitTimeInMs: 250
  });

  const { seekablePartitions, startOffsets } = await resolveTimeRangeSeekTargets(admin, request);
  if (seekablePartitions.length === 0) {
    return [];
  }

  return await runTimeRangeConsumer({
    consumer,
    profile,
    request,
    manualSchema,
    seekablePartitions,
    startOffsets,
    limit
  });
}
