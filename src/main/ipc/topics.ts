import { ipcMain } from "electron";
import { ConfigResourceTypes, type Admin } from "kafkajs";
import type {
  TopicConfigEntry,
  TopicConfigUpdateRequest,
  TopicCreateRequest,
  TopicDetail,
  TopicMessageCounts,
  TopicMutationRequest,
  TopicSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import { configSourceLabel, mapWithConcurrency } from "../kafkaUtils.js";

async function loadTopicConfigs(admin: Admin, topicName: string): Promise<TopicConfigEntry[]> {
  const configsResponse = await admin.describeConfigs({
    resources: [{ type: ConfigResourceTypes.TOPIC, name: topicName }],
    includeSynonyms: true
  });
  const configResource = configsResponse.resources[0];
  if (!configResource) return [];
  if (configResource.errorMessage) {
    throw new Error(configResource.errorMessage);
  }
  return (configResource.configEntries ?? [])
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
}

export function registerTopicIpcHandlers() {
  ipcMain.handle("kafka:health", async (_event, serverId: string): Promise<void> => {
    await withAdmin(serverId, async (admin) => {
      await admin.describeCluster();
    });
  });

  ipcMain.handle("kafka:topics", async (_event, serverId: string): Promise<TopicSummary[]> => {
    return withAdmin(serverId, async (admin) => {
      const metadata = await admin.fetchTopicMetadata();
      return metadata.topics
        .filter((topic) => !topic.name.startsWith("__"))
        .map((topic) => ({
          name: topic.name,
          partitions: topic.partitions.length,
          replicationFactor: topic.partitions[0]?.replicas.length ?? 0
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
  });

  ipcMain.handle("kafka:topic-message-counts", async (_event, serverId: string, topicNames: string[]): Promise<TopicMessageCounts> => {
    const uniqueTopicNames = [...new Set(topicNames.map((topic) => topic.trim()).filter(Boolean))];
    if (uniqueTopicNames.length === 0) return {};
    return withAdmin(serverId, async (admin) => {
      const entries = await mapWithConcurrency(uniqueTopicNames, 6, async (topicName) => {
        try {
          const offsets = await admin.fetchTopicOffsets(topicName);
          const messageCount = offsets.reduce((total, offset) => {
            const high = /^\d+$/.test(offset.high) ? BigInt(offset.high) : 0n;
            const low = /^\d+$/.test(offset.low) ? BigInt(offset.low) : 0n;
            return total + (high > low ? high - low : 0n);
          }, 0n);
          return [topicName, messageCount.toString()] as const;
        } catch {
          return [topicName, "0"] as const;
        }
      });
      return Object.fromEntries(entries);
    });
  });

  ipcMain.handle("kafka:topic-detail", async (_event, serverId: string, topicName: string): Promise<TopicDetail> => {
    return withAdmin(serverId, async (admin) => {
      const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
      const topic = metadata.topics[0];
      if (!topic) {
        throw new Error("Topic not found.");
      }
      const offsets = await admin.fetchTopicOffsets(topicName);
      const configs = await loadTopicConfigs(admin, topicName);
      return {
        name: topic.name,
        partitions: topic.partitions.map((partition) => ({
          partition: partition.partitionId,
          leader: partition.leader,
          replicas: partition.replicas,
          isr: partition.isr
        })),
        offsets: offsets.map((offset) => ({
          partition: offset.partition,
          low: offset.low,
          high: offset.high
        })),
        configs
      };
    });
  });

  ipcMain.handle("kafka:topic-configs", async (_event, serverId: string, topicName: string): Promise<TopicConfigEntry[]> => {
    return withAdmin(serverId, (admin) => loadTopicConfigs(admin, topicName));
  });

  ipcMain.handle("kafka:topic-config-update", async (_event, request: TopicConfigUpdateRequest): Promise<TopicConfigEntry[]> => {
    const entries = request.entries
      .map((entry) => ({ name: entry.name.trim(), value: entry.value }))
      .filter((entry) => entry.name);
    if (entries.length === 0) {
      throw new Error("No topic settings to change.");
    }
    return withAdmin(request.serverId, async (admin) => {
      await admin.alterConfigs({
        validateOnly: Boolean(request.validateOnly),
        resources: [{
          type: ConfigResourceTypes.TOPIC,
          name: request.topic,
          configEntries: entries
        }]
      });
      return loadTopicConfigs(admin, request.topic);
    });
  });

  ipcMain.handle("kafka:topic-create", async (_event, request: TopicCreateRequest): Promise<void> => {
    const topic = request.topic.trim();
    const partitions = Math.trunc(Number(request.partitions));
    const replicationFactor = Math.trunc(Number(request.replicationFactor));
    const configEntries = (request.configs ?? [])
      .map((entry) => ({ name: entry.name.trim(), value: entry.value.trim() }))
      .filter((entry) => entry.name && entry.value !== "");
    if (!topic) {
      throw new Error("Topic name is required.");
    }
    if (!Number.isInteger(partitions) || partitions < 1) {
      throw new Error("Partitions must be 1 or higher.");
    }
    if (!Number.isInteger(replicationFactor) || replicationFactor < 1) {
      throw new Error("Replication factor must be 1 or higher.");
    }
    await withAdmin(request.serverId, async (admin) => {
      await admin.createTopics({
        topics: [{
          topic,
          numPartitions: partitions,
          replicationFactor,
          configEntries
        }],
        waitForLeaders: true,
        timeout: 15000
      });
    });
  });

  ipcMain.handle("kafka:topics-delete", async (_event, request: TopicMutationRequest): Promise<void> => {
    const topics = request.topics.map((topic) => topic.trim()).filter(Boolean);
    if (topics.length === 0) {
      throw new Error("No topics selected.");
    }
    await withAdmin(request.serverId, async (admin) => {
      await admin.deleteTopics({ topics, timeout: 15000 });
    });
  });

  ipcMain.handle("kafka:topics-purge", async (_event, request: TopicMutationRequest): Promise<void> => {
    const topics = request.topics.map((topic) => topic.trim()).filter(Boolean);
    if (topics.length === 0) {
      throw new Error("No topics selected.");
    }
    await withAdmin(request.serverId, async (admin) => {
      for (const topic of topics) {
        const offsets = await admin.fetchTopicOffsets(topic);
        await admin.deleteTopicRecords({
          topic,
          partitions: offsets.map((offset) => ({
            partition: offset.partition,
            offset: offset.high
          }))
        });
      }
    });
  });
}
