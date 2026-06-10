import type {
  TopicCreateRequest,
  TopicMutationRequest
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";

export async function createTopic(request: TopicCreateRequest): Promise<void> {
  const topic = request.topic.trim();
  const partitions = Math.trunc(Number(request.partitions));
  const replicationFactor = Math.trunc(Number(request.replicationFactor));
  const configEntries = (request.configs ?? [])
    .map((entry) => ({ name: entry.name.trim(), value: entry.value.trim() }))
    .filter((entry) => entry.name && entry.value !== "");
  if (!topic) {
    throw new Error("Topic name is required.");
  }
  if (!Number.isInteger(partitions) || partitions < 1) {
    throw new Error("Partitions must be 1 or higher.");
  }
  if (!Number.isInteger(replicationFactor) || replicationFactor < 1) {
    throw new Error("Replication factor must be 1 or higher.");
  }
  await withAdmin(request.serverId, async (admin) => {
    await admin.createTopics({
      topics: [{
        topic,
        numPartitions: partitions,
        replicationFactor,
        configEntries
      }],
      waitForLeaders: true,
      timeout: 15000
    });
  });
}

function normalizeTopicMutationNames(request: TopicMutationRequest) {
  const topics = request.topics.map((topic) => topic.trim()).filter(Boolean);
  if (topics.length === 0) {
    throw new Error("No topics selected.");
  }
  return topics;
}

export async function deleteTopics(request: TopicMutationRequest): Promise<void> {
  const topics = normalizeTopicMutationNames(request);
  await withAdmin(request.serverId, async (admin) => {
    await admin.deleteTopics({ topics, timeout: 15000 });
  });
}

export async function purgeTopics(request: TopicMutationRequest): Promise<void> {
  const topics = normalizeTopicMutationNames(request);
  await withAdmin(request.serverId, async (admin) => {
    for (const topic of topics) {
      const offsets = await admin.fetchTopicOffsets(topic);
      await admin.deleteTopicRecords({
        topic,
        partitions: offsets.map((offset) => ({
          partition: offset.partition,
          offset: offset.high
        }))
      });
    }
  });
}
