import type { ConsumerGroupLagDetail } from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import { calculateLag } from "../kafkaUtils.js";

export async function loadConsumerGroupLag(serverId: string, groupId: string): Promise<ConsumerGroupLagDetail> {
  return withAdmin(serverId, async (admin) => {
    const [groupOffsets, describedGroups] = await Promise.all([
      admin.fetchOffsets({ groupId }),
      admin.describeGroups([groupId]).catch(() => ({ groups: [] }))
    ]);
    const describedGroup = describedGroups.groups[0];
    const topicNames = [...new Set(groupOffsets.map((topicOffset) => topicOffset.topic))];
    const startOffsetsByTopic = new Map<string, Map<number, string>>();
    const endOffsetsByTopic = new Map<string, Map<number, string>>();

    await Promise.all(topicNames.map(async (topic) => {
      const offsets = await admin.fetchTopicOffsets(topic);
      startOffsetsByTopic.set(
        topic,
        new Map(offsets.map((offset) => [offset.partition, offset.low]))
      );
      endOffsetsByTopic.set(
        topic,
        new Map(offsets.map((offset) => [offset.partition, offset.high]))
      );
    }));

    const rows = groupOffsets.flatMap((topicOffset) =>
      topicOffset.partitions.map((partitionOffset) => {
        const endOffset = endOffsetsByTopic.get(topicOffset.topic)?.get(partitionOffset.partition) ?? "-";
        const startOffset = startOffsetsByTopic.get(topicOffset.topic)?.get(partitionOffset.partition) ?? "0";
        const currentOffset = partitionOffset.offset;
        return {
          topic: topicOffset.topic,
          partition: partitionOffset.partition,
          currentOffset: currentOffset === "-1" ? "-" : currentOffset,
          startOffset,
          endOffset,
          lag: calculateLag(currentOffset, endOffset),
          metadata: partitionOffset.metadata ?? undefined
        };
      })
    ).sort((left, right) => (
      left.topic.localeCompare(right.topic) || left.partition - right.partition
    ));

    const totalLag = rows.reduce<bigint | null>((total, row) => {
      if (!/^\d+$/.test(row.lag)) return total;
      return (total ?? 0n) + BigInt(row.lag);
    }, null);

    return {
      groupId,
      state: describedGroup?.state,
      protocol: describedGroup?.protocolType,
      members: describedGroup?.members.length ?? 0,
      totalLag: totalLag?.toString() ?? "-",
      rows
    };
  });
}
