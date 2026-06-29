import type {
  ConsumerGroupLagDetail,
  ConsumerGroupMutationRequest,
  ConsumerGroupOffsetResetRequest,
  ConsumerGroupOffsetResetResult,
  ConsumerGroupSummary
} from "../../shared/types.js";
import {
  deleteConsumerGroups,
  listConsumerGroups,
  loadConsumerGroupLag,
  resetConsumerGroupOffsets
} from "./consumerGroupQueries.js";
import { handleLogged } from "./ipcErrorBoundary.js";

export function registerConsumerGroupIpcHandlers() {
  handleLogged("kafka:groups", async (_event, serverId: string): Promise<ConsumerGroupSummary[]> => {
    return listConsumerGroups(serverId);
  });

  handleLogged("kafka:groups-delete", async (_event, request: ConsumerGroupMutationRequest): Promise<void> => {
    await deleteConsumerGroups(request);
  });

  handleLogged("kafka:group-lag", async (_event, serverId: string, groupId: string): Promise<ConsumerGroupLagDetail> => {
    return loadConsumerGroupLag(serverId, groupId);
  });

  handleLogged("kafka:group-offsets-reset", async (_event, request: ConsumerGroupOffsetResetRequest): Promise<ConsumerGroupOffsetResetResult> => {
    return resetConsumerGroupOffsets(request);
  });
}
