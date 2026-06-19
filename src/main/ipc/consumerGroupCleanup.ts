import { writeAppLog } from "../logger.js";
import { withAdmin } from "../kafkaClient.js";

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function deleteKafkaToolConsumerGroup(serverId: string, groupId: string) {
  await delay(2000);
  try {
    await withAdmin(serverId, async (admin) => {
      await admin.deleteGroups([groupId]);
    });
  } catch (error) {
    await writeAppLog("warn", "kafka.consumerGroupCleanup", `Failed to delete internal consumer group ${groupId}.`, error);
  }
}
