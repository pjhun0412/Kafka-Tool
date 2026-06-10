import { ipcMain } from "electron";
import type {
  ConsumerGroupLagDetail,
  ConsumerGroupMutationRequest,
  ConsumerGroupSummary
} from "../../shared/types.js";
import {
  deleteConsumerGroups,
  listConsumerGroups,
  loadConsumerGroupLag
} from "./consumerGroupQueries.js";

export function registerConsumerGroupIpcHandlers() {
  ipcMain.handle("kafka:groups", async (_event, serverId: string): Promise<ConsumerGroupSummary[]> => {
    return listConsumerGroups(serverId);
  });

  ipcMain.handle("kafka:groups-delete", async (_event, request: ConsumerGroupMutationRequest): Promise<void> => {
    await deleteConsumerGroups(request);
  });

  ipcMain.handle("kafka:group-lag", async (_event, serverId: string, groupId: string): Promise<ConsumerGroupLagDetail> => {
    return loadConsumerGroupLag(serverId, groupId);
  });
}
