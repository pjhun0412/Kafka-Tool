import { contextBridge, ipcRenderer } from "electron";
import type { AppPreferences, ConsumedMessage, ConsumeOffsetRequest, ConsumeTimeRangeRequest, ImportSettingsResult, KafkaApi, MessageExportRequest, ProduceRequest, ServerProfile, StartConsumeRequest, StopConsumeRequest, UpdateStatus } from "../shared/types.js";

const api: KafkaApi = {
  listServers: () => ipcRenderer.invoke("servers:list"),
  saveServer: (server: Omit<ServerProfile, "id"> & { id?: string }) => ipcRenderer.invoke("servers:save", server),
  deleteServer: (id: string) => ipcRenderer.invoke("servers:delete", id),
  reorderServers: (ids: string[]) => ipcRenderer.invoke("servers:reorder", ids),
  exportSettings: () => ipcRenderer.invoke("settings:export"),
  importSettings: () => ipcRenderer.invoke("settings:import"),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  installUpdate: () => ipcRenderer.invoke("updates:install"),
  loadPreferences: () => ipcRenderer.invoke("preferences:load"),
  savePreferences: (preferences: AppPreferences) => ipcRenderer.invoke("preferences:save", preferences),
  listTopics: (serverId: string) => ipcRenderer.invoke("kafka:topics", serverId),
  getTopicDetail: (serverId: string, topic: string) => ipcRenderer.invoke("kafka:topic-detail", serverId, topic),
  listConsumerGroups: (serverId: string) => ipcRenderer.invoke("kafka:groups", serverId),
  getConsumerGroupLag: (serverId: string, groupId: string) => ipcRenderer.invoke("kafka:group-lag", serverId, groupId),
  exportMessages: (request: MessageExportRequest) => ipcRenderer.invoke("messages:export", request),
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
  onUpdateStatus: (callback: (status: UpdateStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => callback(status);
    ipcRenderer.on("updates:status", listener);
    return () => ipcRenderer.removeListener("updates:status", listener);
  }
};

contextBridge.exposeInMainWorld("kafkaApi", api);
