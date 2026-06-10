import { ipcMain } from "electron";
import type {
  TopicConfigEntry,
  TopicConfigUpdateRequest,
  TopicCreateRequest,
  TopicMessageCounts,
  TopicMutationRequest,
  TopicSummary
} from "../../shared/types.js";
import { withAdmin } from "../kafkaClient.js";
import {
  loadTopicConfigs,
  updateTopicConfigs
} from "./topicConfigs.js";
import {
  createTopic,
  deleteTopics,
  purgeTopics
} from "./topicMutations.js";
import {
  checkKafkaHealth,
  listTopics,
  loadTopicDetail,
  loadTopicMessageCounts
} from "./topicQueries.js";

export function registerTopicIpcHandlers() {
  ipcMain.handle("kafka:health", async (_event, serverId: string): Promise<void> => {
    await checkKafkaHealth(serverId);
  });

  ipcMain.handle("kafka:topics", async (_event, serverId: string): Promise<TopicSummary[]> => {
    return listTopics(serverId);
  });

  ipcMain.handle("kafka:topic-message-counts", async (_event, serverId: string, topicNames: string[]): Promise<TopicMessageCounts> => {
    return loadTopicMessageCounts(serverId, topicNames);
  });

  ipcMain.handle("kafka:topic-detail", async (_event, serverId: string, topicName: string) => {
    return loadTopicDetail(serverId, topicName);
  });

  ipcMain.handle("kafka:topic-configs", async (_event, serverId: string, topicName: string): Promise<TopicConfigEntry[]> => {
    return withAdmin(serverId, (admin) => loadTopicConfigs(admin, topicName));
  });

  ipcMain.handle("kafka:topic-config-update", async (_event, request: TopicConfigUpdateRequest): Promise<TopicConfigEntry[]> => {
    return updateTopicConfigs(request);
  });

  ipcMain.handle("kafka:topic-create", async (_event, request: TopicCreateRequest): Promise<void> => {
    await createTopic(request);
  });

  ipcMain.handle("kafka:topics-delete", async (_event, request: TopicMutationRequest): Promise<void> => {
    await deleteTopics(request);
  });

  ipcMain.handle("kafka:topics-purge", async (_event, request: TopicMutationRequest): Promise<void> => {
    await purgeTopics(request);
  });
}
