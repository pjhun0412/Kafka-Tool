import type {
  ConsumerGroupMutationRequest,
  ConsumerGroupSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import { buildConsumerGroupSummaries } from "./consumerGroupSummaries.js";
export { loadConsumerGroupLag } from "./consumerGroupLag.js";

export async function listConsumerGroups(serverId: string): Promise<ConsumerGroupSummary[]> {
  return withAdmin(serverId, async (admin) => {
    const groups = await admin.listGroups();
    return buildConsumerGroupSummaries(admin, groups.groups);
  });
}

export async function deleteConsumerGroups(request: ConsumerGroupMutationRequest): Promise<void> {
  const groupIds = request.groupIds.map((groupId) => groupId.trim()).filter(Boolean);
  if (groupIds.length === 0) {
    throw new Error("No consumer groups selected.");
  }
  await withAdmin(request.serverId, async (admin) => {
    await admin.deleteGroups(groupIds);
  });
}
