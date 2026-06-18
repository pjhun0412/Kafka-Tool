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
import { handleLogged } from "./ipcErrorBoundary.js";

export function registerBrokerIpcHandlers() {
  handleLogged("kafka:brokers", async (_event, serverId: string): Promise<BrokerSummary[]> => {
    return withAdmin(serverId, loadBrokerSummaries);
  });

  handleLogged("kafka:broker-detail", async (_event, serverId: string, brokerId: number): Promise<BrokerDetail> => {
    return withAdmin(serverId, (admin) => loadBrokerDetail(admin, brokerId));
  });

  handleLogged("kafka:broker-config-update", async (_event, request: BrokerConfigUpdateRequest): Promise<BrokerDetail> => {
    return updateBrokerConfig(request);
  });
}
