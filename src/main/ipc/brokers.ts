import { ipcMain } from "electron";
import type {
  BrokerConfigUpdateRequest,
  BrokerDetail,
  BrokerSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import {
  loadBrokerDetail,
  updateBrokerConfig
} from "./brokerConfigs.js";
import { loadBrokerSummaries } from "./brokerQueries.js";

export function registerBrokerIpcHandlers() {
  ipcMain.handle("kafka:brokers", async (_event, serverId: string): Promise<BrokerSummary[]> => {
    return withAdmin(serverId, loadBrokerSummaries);
  });

  ipcMain.handle("kafka:broker-detail", async (_event, serverId: string, brokerId: number): Promise<BrokerDetail> => {
    return withAdmin(serverId, (admin) => loadBrokerDetail(admin, brokerId));
  });

  ipcMain.handle("kafka:broker-config-update", async (_event, request: BrokerConfigUpdateRequest): Promise<BrokerDetail> => {
    return updateBrokerConfig(request);
  });
}
