import type { Admin } from "kafkajs";
import type { BrokerSummary } from "../../shared/types.js";

export async function loadBrokerSummaries(admin: Admin): Promise<BrokerSummary[]> {
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
