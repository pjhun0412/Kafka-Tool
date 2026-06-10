import { ipcMain } from "electron";
import { ConfigResourceTypes, type Admin } from "kafkajs";
import type {
  BrokerConfigEntry,
  BrokerConfigUpdateRequest,
  BrokerDetail,
  BrokerSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import { configSourceLabel } from "../kafkaUtils.js";

async function loadBrokerSummaries(admin: Admin): Promise<BrokerSummary[]> {
  const [cluster, metadata] = await Promise.all([
    admin.describeCluster(),
    admin.fetchTopicMetadata()
  ]);
  const brokerStats = new Map<number, BrokerSummary>();
  for (const broker of cluster.brokers) {
    brokerStats.set(broker.nodeId, {
      nodeId: broker.nodeId,
      host: broker.host,
      port: broker.port,
      controller: broker.nodeId === cluster.controller,
      leaderCount: 0,
      replicaCount: 0,
      inSyncReplicaCount: 0,
      outOfSyncReplicaCount: 0,
      onlinePartitionCount: 0,
      underReplicatedPartitionCount: 0,
      leaderSkewPercent: 0,
      partitionSkewPercent: 0
    });
  }

  let totalLeaders = 0;
  let totalReplicas = 0;
  for (const topic of metadata.topics.filter((item) => !item.name.startsWith("__"))) {
    for (const partition of topic.partitions) {
      const leader = brokerStats.get(partition.leader);
      if (leader) {
        leader.leaderCount += 1;
        leader.onlinePartitionCount += 1;
        totalLeaders += 1;
        if (partition.isr.length < partition.replicas.length) {
          leader.underReplicatedPartitionCount += 1;
        }
      }

      for (const replicaId of partition.replicas) {
        const replica = brokerStats.get(replicaId);
        if (!replica) continue;
        replica.replicaCount += 1;
        totalReplicas += 1;
        if (partition.isr.includes(replicaId)) {
          replica.inSyncReplicaCount += 1;
        } else {
          replica.outOfSyncReplicaCount += 1;
        }
      }
    }
  }

  const averageLeaders = brokerStats.size > 0 ? totalLeaders / brokerStats.size : 0;
  const averageReplicas = brokerStats.size > 0 ? totalReplicas / brokerStats.size : 0;
  return [...brokerStats.values()]
    .map((broker) => ({
      ...broker,
      leaderSkewPercent: averageLeaders > 0 ? ((broker.leaderCount - averageLeaders) / averageLeaders) * 100 : 0,
      partitionSkewPercent: averageReplicas > 0 ? ((broker.replicaCount - averageReplicas) / averageReplicas) * 100 : 0
    }))
    .sort((left, right) => left.nodeId - right.nodeId);
}

async function loadBrokerDetail(admin: Admin, brokerId: number): Promise<BrokerDetail> {
  const brokers = await loadBrokerSummaries(admin);
  const broker = brokers.find((item) => item.nodeId === brokerId);
  if (!broker) {
    throw new Error("Broker not found.");
  }
  const configsResponse = await admin.describeConfigs({
    resources: [{ type: ConfigResourceTypes.BROKER, name: String(brokerId) }],
    includeSynonyms: true
  });
  const configResource = configsResponse.resources[0];
  const configs: BrokerConfigEntry[] = (configResource?.configEntries ?? [])
    .map((entry) => ({
      name: entry.configName,
      value: entry.isSensitive ? "" : entry.configValue ?? "",
      source: configSourceLabel(entry.configSource),
      isDefault: entry.isDefault,
      isSensitive: entry.isSensitive,
      readOnly: entry.readOnly,
      synonyms: (entry.configSynonyms ?? []).map((synonym) => ({
        name: synonym.configName,
        value: entry.isSensitive ? "" : synonym.configValue ?? "",
        source: configSourceLabel(synonym.configSource)
      }))
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    broker,
    configs,
    logDirectories: [],
    logDirectoriesSupported: false
  };
}

export function registerBrokerIpcHandlers() {
  ipcMain.handle("kafka:brokers", async (_event, serverId: string): Promise<BrokerSummary[]> => {
    return withAdmin(serverId, loadBrokerSummaries);
  });

  ipcMain.handle("kafka:broker-detail", async (_event, serverId: string, brokerId: number): Promise<BrokerDetail> => {
    return withAdmin(serverId, (admin) => loadBrokerDetail(admin, brokerId));
  });

  ipcMain.handle("kafka:broker-config-update", async (_event, request: BrokerConfigUpdateRequest): Promise<BrokerDetail> => {
    return withAdmin(request.serverId, async (admin) => {
      await admin.alterConfigs({
        validateOnly: Boolean(request.validateOnly),
        resources: [{
          type: ConfigResourceTypes.BROKER,
          name: String(request.brokerId),
          configEntries: [{ name: request.name, value: request.value }]
        }]
      });
      return loadBrokerDetail(admin, request.brokerId);
    });
  });
}
