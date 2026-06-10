import type { Admin } from "kafkajs";
import type { ConsumeTimeRangeRequest } from "../../shared/types.js";

export async function resolveTimeRangeSeekTargets(admin: Admin, request: ConsumeTimeRangeRequest) {
  await admin.connect();
  try {
    const metadata = await admin.fetchTopicMetadata({ topics: [request.topic] });
    const topic = metadata.topics[0];
    if (!topic) {
      throw new Error("Topic not found.");
    }

    const partitions = topic.partitions
      .map((partition) => partition.partitionId)
      .filter((partition) => request.partition === undefined || partition === request.partition);
    const offsets = await admin.fetchTopicOffsetsByTimestamp(request.topic, request.startTimestamp);
    const startOffsets = new Map(offsets.map((offset) => [offset.partition, offset.offset]));
    const seekablePartitions = partitions.filter((partition) => {
      const offset = startOffsets.get(partition);
      return offset !== undefined && offset !== "-1" && /^\d+$/.test(offset);
    });

    return {
      startOffsets,
      seekablePartitions
    };
  } finally {
    await admin.disconnect();
  }
}
