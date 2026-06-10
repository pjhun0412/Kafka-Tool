import type { Admin } from "kafkajs";
import type { ConsumerGroupSummary } from "../../shared/types.js";
import { calculateLag } from "../kafkaUtils.js";

type ListedConsumerGroup = {
  groupId: string;
  protocolType?: string;
};

type DescribedConsumerGroup = {
  groupId: string;
  protocolType?: string;
  state?: string;
  members: unknown[];
};

export async function buildConsumerGroupSummaries(admin: Admin, groups: ListedConsumerGroup[]): Promise<ConsumerGroupSummary[]> {
  const groupIds = groups.map((group) => group.groupId);
  const describedGroups = groupIds.length > 0
    ? await admin.describeGroups(groupIds).catch(() => ({ groups: [] as DescribedConsumerGroup[] }))
    : { groups: [] as DescribedConsumerGroup[] };
  const describedById = new Map(describedGroups.groups.map((group) => [group.groupId, group]));
  const endOffsetsByTopic = new Map<string, Map<number, string>>();

  async function getEndOffsets(topic: string) {
    const cached = endOffsetsByTopic.get(topic);
    if (cached) return cached;
    const offsets = await admin.fetchTopicOffsets(topic);
    const mapped = new Map(offsets.map((offset) => [offset.partition, offset.high]));
    endOffsetsByTopic.set(topic, mapped);
    return mapped;
  }

  const summaries = await Promise.all(groups.map(async (group) => {
    const described = describedById.get(group.groupId);
    const summary: ConsumerGroupSummary = {
      groupId: group.groupId,
      protocol: described?.protocolType ?? group.protocolType,
      state: described?.state,
      members: described?.members.length
    };

    try {
      const groupOffsets = await admin.fetchOffsets({ groupId: group.groupId });
      const topicNames = [...new Set(groupOffsets.map((topicOffset) => topicOffset.topic))];
      const topicEndOffsets = new Map<string, Map<number, string>>();

      await Promise.all(topicNames.map(async (topic) => {
        topicEndOffsets.set(topic, await getEndOffsets(topic));
      }));

      let assignedPartitions = 0;
      const totalLag = groupOffsets.reduce<bigint | null>((total, topicOffset) => {
        assignedPartitions += topicOffset.partitions.length;
        return topicOffset.partitions.reduce<bigint | null>((partitionTotal, partitionOffset) => {
          const endOffset = topicEndOffsets.get(topicOffset.topic)?.get(partitionOffset.partition) ?? "-";
          const lag = calculateLag(partitionOffset.offset, endOffset);
          if (!/^\d+$/.test(lag)) return partitionTotal;
          return (partitionTotal ?? 0n) + BigInt(lag);
        }, total);
      }, null);

      return {
        ...summary,
        topics: topicNames.length,
        assignedPartitions,
        totalLag: totalLag?.toString() ?? "-"
      };
    } catch {
      return summary;
    }
  }));

  return summaries
    .map((summary) => {
      const described = describedById.get(summary.groupId);
      return {
        ...summary,
        protocol: summary.protocol ?? described?.protocolType,
        state: summary.state ?? described?.state,
        members: summary.members ?? described?.members.length
      };
    })
    .sort((a, b) => a.groupId.localeCompare(b.groupId));
}
