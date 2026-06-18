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
import { handleLogged } from "./ipcErrorBoundary.js";

export function registerTopicIpcHandlers() {
  handleLogged("kafka:health", async (_event, serverId: string): Promise<void> => {
    await checkKafkaHealth(serverId);
  });

  handleLogged("kafka:topics", async (_event, serverId: string): Promise<TopicSummary[]> => {
    return listTopics(serverId);
  });

  handleLogged("kafka:topic-message-counts", async (_event, serverId: string, topicNames: string[]): Promise<TopicMessageCounts> => {
    return loadTopicMessageCounts(serverId, topicNames);
  });

  handleLogged("kafka:topic-detail", async (_event, serverId: string, topicName: string) => {
    return loadTopicDetail(serverId, topicName);
  });

  handleLogged("kafka:topic-configs", async (_event, serverId: string, topicName: string): Promise<TopicConfigEntry[]> => {
    return withAdmin(serverId, (admin) => loadTopicConfigs(admin, topicName));
  });

  handleLogged("kafka:topic-config-update", async (_event, request: TopicConfigUpdateRequest): Promise<TopicConfigEntry[]> => {
    return updateTopicConfigs(request);
  });

  handleLogged("kafka:topic-create", async (_event, request: TopicCreateRequest): Promise<void> => {
    await createTopic(request);
  });

  handleLogged("kafka:topics-delete", async (_event, request: TopicMutationRequest): Promise<void> => {
    await deleteTopics(request);
  });

  handleLogged("kafka:topics-purge", async (_event, request: TopicMutationRequest): Promise<void> => {
    await purgeTopics(request);
  });
}
