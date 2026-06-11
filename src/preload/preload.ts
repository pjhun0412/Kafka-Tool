import { contextBridge, ipcRenderer } from "electron";
import type { AppMenuLanguage, AppPreferenceSection, AppPreferences, BrokerConfigUpdateRequest, ConsumedMessage, ConsumeOffsetRequest, ConsumeTimeRangeRequest, ConsumerGroupMutationRequest, ImportSettingsResult, KafkaApi, MessageExportRequest, OffsetMessageExportRequest, ProduceRequest, ServerProfile, StartConsumeRequest, StopConsumeRequest, TopicConfigUpdateRequest, TopicCreateRequest, TopicMutationRequest, UpdateStatus } from "../shared/types.js";

const api: KafkaApi = {
  listServers: () => ipcRenderer.invoke("servers:list"),
  saveServer: (server: Omit<ServerProfile, "id"> & { id?: string }) => ipcRenderer.invoke("servers:save", server),
  deleteServer: (id: string) => ipcRenderer.invoke("servers:delete", id),
  reorderServers: (ids: string[]) => ipcRenderer.invoke("servers:reorder", ids),
  exportSettings: () => ipcRenderer.invoke("settings:export"),
  importSettings: () => ipcRenderer.invoke("settings:import"),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  installUpdate: () => ipcRenderer.invoke("updates:install"),
  getAppVersion: () => ipcRenderer.invoke("app:version"),
  loadPreferences: () => ipcRenderer.invoke("preferences:load"),
  savePreferences: (preferences: AppPreferences) => ipcRenderer.invoke("preferences:save", preferences),
  setMenuLanguage: (language: AppMenuLanguage) => ipcRenderer.invoke("menu:set-language", language),
  checkHealth: (serverId: string) => ipcRenderer.invoke("kafka:health", serverId),
  listTopics: (serverId: string) => ipcRenderer.invoke("kafka:topics", serverId),
  listTopicMessageCounts: (serverId: string, topics: string[]) => ipcRenderer.invoke("kafka:topic-message-counts", serverId, topics),
  listBrokers: (serverId: string) => ipcRenderer.invoke("kafka:brokers", serverId),
  getBrokerDetail: (serverId: string, brokerId: number) => ipcRenderer.invoke("kafka:broker-detail", serverId, brokerId),
  updateBrokerConfig: (request: BrokerConfigUpdateRequest) => ipcRenderer.invoke("kafka:broker-config-update", request),
  getTopicDetail: (serverId: string, topic: string) => ipcRenderer.invoke("kafka:topic-detail", serverId, topic),
  getTopicConfigs: (serverId: string, topic: string) => ipcRenderer.invoke("kafka:topic-configs", serverId, topic),
  updateTopicConfigs: (request: TopicConfigUpdateRequest) => ipcRenderer.invoke("kafka:topic-config-update", request),
  createTopic: (request: TopicCreateRequest) => ipcRenderer.invoke("kafka:topic-create", request),
  deleteTopics: (request: TopicMutationRequest) => ipcRenderer.invoke("kafka:topics-delete", request),
  purgeTopics: (request: TopicMutationRequest) => ipcRenderer.invoke("kafka:topics-purge", request),
  listConsumerGroups: (serverId: string) => ipcRenderer.invoke("kafka:groups", serverId),
  deleteConsumerGroups: (request: ConsumerGroupMutationRequest) => ipcRenderer.invoke("kafka:groups-delete", request),
  getConsumerGroupLag: (serverId: string, groupId: string) => ipcRenderer.invoke("kafka:group-lag", serverId, groupId),
  exportMessages: (request: MessageExportRequest) => ipcRenderer.invoke("messages:export", request),
  exportOffsetMessages: (request: OffsetMessageExportRequest) => ipcRenderer.invoke("messages:export-offset", request),
  produce: (message: ProduceRequest) => ipcRenderer.invoke("kafka:produce", message),
  consumeFromOffset: (request: ConsumeOffsetRequest) => ipcRenderer.invoke("kafka:consume-offset", request),
  consumeTimeRange: (request: ConsumeTimeRangeRequest) => ipcRenderer.invoke("kafka:consume-time-range", request),
  startConsume: (request: StartConsumeRequest) => ipcRenderer.invoke("kafka:consume-start", request),
  stopConsume: (request?: StopConsumeRequest) => ipcRenderer.invoke("kafka:consume-stop", request),
  onConsumeMessage: (callback: (message: ConsumedMessage) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: ConsumedMessage) => callback(message);
    ipcRenderer.on("kafka:consume-message", listener);
    return () => ipcRenderer.removeListener("kafka:consume-message", listener);
  },
  onConsumeError: (callback: (error: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on("kafka:consume-error", listener);
    return () => ipcRenderer.removeListener("kafka:consume-error", listener);
  },
  onSettingsImported: (callback: (result: ImportSettingsResult) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, result: ImportSettingsResult) => callback(result);
    ipcRenderer.on("settings:imported", listener);
    return () => ipcRenderer.removeListener("settings:imported", listener);
  },
  onSettingsExported: (callback: (filePath: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, filePath: string) => callback(filePath);
    ipcRenderer.on("settings:exported", listener);
    return () => ipcRenderer.removeListener("settings:exported", listener);
  },
  onSettingsError: (callback: (error: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on("settings:error", listener);
    return () => ipcRenderer.removeListener("settings:error", listener);
  },
  onPreferencesOpen: (callback: (section?: AppPreferenceSection) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, section?: AppPreferenceSection) => callback(section);
    ipcRenderer.on("preferences:open", listener);
    return () => ipcRenderer.removeListener("preferences:open", listener);
  },
  onReleaseNotesOpen: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("release-notes:open", listener);
    return () => ipcRenderer.removeListener("release-notes:open", listener);
  },
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status);
    ipcRenderer.on("updates:status", listener);
    return () => ipcRenderer.removeListener("updates:status", listener);
  }
};

contextBridge.exposeInMainWorld("kafkaApi", api);
