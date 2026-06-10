import type {
  TopicDetail,
  TopicMessageCounts,
  TopicSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import { mapWithConcurrency } from "../kafkaUtils.js";
import { loadTopicConfigs } from "./topicConfigs.js";

export async function checkKafkaHealth(serverId: string): Promise<void> {
  await withAdmin(serverId, async (admin) => {
    await admin.describeCluster();
  });
}

export async function listTopics(serverId: string): Promise<TopicSummary[]> {
  return withAdmin(serverId, async (admin) => {
    const metadata = await admin.fetchTopicMetadata();
    return metadata.topics
      .filter((topic) => !topic.name.startsWith("__"))
      .map((topic) => ({
        name: topic.name,
        partitions: topic.partitions.length,
        replicationFactor: topic.partitions[0]?.replicas.length ?? 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
}

export async function loadTopicMessageCounts(serverId: string, topicNames: string[]): Promise<TopicMessageCounts> {
  const uniqueTopicNames = [...new Set(topicNames.map((topic) => topic.trim()).filter(Boolean))];
  if (uniqueTopicNames.length === 0) return {};
  return withAdmin(serverId, async (admin) => {
    const entries = await mapWithConcurrency(uniqueTopicNames, 6, async (topicName) => {
      try {
        const offsets = await admin.fetchTopicOffsets(topicName);
        const messageCount = offsets.reduce((total, offset) => {
          const high = /^\d+$/.test(offset.high) ? BigInt(offset.high) : 0n;
          const low = /^\d+$/.test(offset.low) ? BigInt(offset.low) : 0n;
          return total + (high > low ? high - low : 0n);
        }, 0n);
        return [topicName, messageCount.toString()] as const;
      } catch {
        return [topicName, "0"] as const;
      }
    });
    return Object.fromEntries(entries);
  });
}

export async function loadTopicDetail(serverId: string, topicName: string): Promise<TopicDetail> {
  return withAdmin(serverId, async (admin) => {
    const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
    const topic = metadata.topics[0];
    if (!topic) {
      throw new Error("Topic not found.");
    }
    const offsets = await admin.fetchTopicOffsets(topicName);
    const configs = await loadTopicConfigs(admin, topicName);
    return {
      name: topic.name,
      partitions: topic.partitions.map((partition) => ({
        partition: partition.partitionId,
        leader: partition.leader,
        replicas: partition.replicas,
        isr: partition.isr
      })),
      offsets: offsets.map((offset) => ({
        partition: offset.partition,
        low: offset.low,
        high: offset.high
      })),
      configs
    };
  });
}
