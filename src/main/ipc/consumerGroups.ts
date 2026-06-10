import { ipcMain } from "electron";
import type {
  ConsumerGroupLagDetail,
  ConsumerGroupMutationRequest,
  ConsumerGroupSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import { calculateLag } from "../kafkaUtils.js";

export function registerConsumerGroupIpcHandlers() {
  ipcMain.handle("kafka:groups", async (_event, serverId: string): Promise<ConsumerGroupSummary[]> => {
    return withAdmin(serverId, async (admin) => {
      const groups = await admin.listGroups();
      const groupIds = groups.groups.map((group) => group.groupId);
      const describedGroups = groupIds.length > 0
        ? await admin.describeGroups(groupIds).catch(() => ({ groups: [] }))
        : { groups: [] };
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

      const summaries = await Promise.all(groups.groups.map(async (group) => {
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
    });
  });

  ipcMain.handle("kafka:groups-delete", async (_event, request: ConsumerGroupMutationRequest): Promise<void> => {
    const groupIds = request.groupIds.map((groupId) => groupId.trim()).filter(Boolean);
    if (groupIds.length === 0) {
      throw new Error("No consumer groups selected.");
    }
    await withAdmin(request.serverId, async (admin) => {
      await admin.deleteGroups(groupIds);
    });
  });

  ipcMain.handle("kafka:group-lag", async (_event, serverId: string, groupId: string): Promise<ConsumerGroupLagDetail> => {
    return withAdmin(serverId, async (admin) => {
      const [groupOffsets, describedGroups] = await Promise.all([
        admin.fetchOffsets({ groupId }),
        admin.describeGroups([groupId]).catch(() => ({ groups: [] }))
      ]);
      const describedGroup = describedGroups.groups[0];
      const topicNames = [...new Set(groupOffsets.map((topicOffset) => topicOffset.topic))];
      const endOffsetsByTopic = new Map<string, Map<number, string>>();

      await Promise.all(topicNames.map(async (topic) => {
        const offsets = await admin.fetchTopicOffsets(topic);
        endOffsetsByTopic.set(
          topic,
          new Map(offsets.map((offset) => [offset.partition, offset.high]))
        );
      }));

      const rows = groupOffsets.flatMap((topicOffset) =>
        topicOffset.partitions.map((partitionOffset) => {
          const endOffset = endOffsetsByTopic.get(topicOffset.topic)?.get(partitionOffset.partition) ?? "-";
          const currentOffset = partitionOffset.offset;
          return {
            topic: topicOffset.topic,
            partition: partitionOffset.partition,
            currentOffset: currentOffset === "-1" ? "-" : currentOffset,
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
  });
}
