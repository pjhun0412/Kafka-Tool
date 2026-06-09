import type { Dispatch, SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import type { BrokerSummary, ConsumerGroupSummary, KafkaApi, ServerProfile, TopicSummary } from "../../../shared/types";
import { buildServerProfileInput } from "../../serverProfileForm";
import { useServerFormStore } from "../../stores/ui/serverFormStore";
import type { ToastState, TopicConsumeState, TopicWorkView, View, WorkspaceActionTarget } from "../../uiTypes";
import { readStreamingTopicKey } from "../../workspaceState";
import { addIdOnce, removeId, removeServerRecord, reorderServers } from "./serverLifecycleUtils";

type ServerLifecycleActionsParams = {
  kafkaApi: KafkaApi | undefined;
  servers: ServerProfile[];
  connectedServerIds: string[];
  openClusterIds: string[];
  selectedServerId: string;
  streamingTopicsByServer: Record<string, string[]>;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  stopConsume: (serverId: string, topic: string, pane?: "primary" | "split") => Promise<void>;
  refreshTopicsForServer: (
    serverId: string,
    target?: WorkspaceActionTarget,
    options?: { label?: string; detailLabel?: string }
  ) => Promise<void>;
  refreshBrokersForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  refreshGroupsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  setServers: Dispatch<SetStateAction<ServerProfile[]>>;
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setConnectedServerIds: Dispatch<SetStateAction<string[]>>;
  setFailedServerIds: Dispatch<SetStateAction<string[]>>;
  setHealthFailuresByServer: Dispatch<SetStateAction<Record<string, number>>>;
  setOpenClusterIds: Dispatch<SetStateAction<string[]>>;
  setOpenedTopicTabs: (tabs: string[]) => void;
  setSelectedTopic: (topic: string) => void;
  setTopicDetail: (detail: null) => void;
  setTopics: (topics: TopicSummary[]) => void;
  setGroups: (groups: ConsumerGroupSummary[]) => void;
  setBrokersByServer: Dispatch<SetStateAction<Record<string, BrokerSummary[]>>>;
  setConsumeStates: (states: Record<string, TopicConsumeState>) => void;
  setSplitConsumeStatesByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicConsumeState>>>>;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
  setStreamingTopicsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setConnectionError: Dispatch<SetStateAction<{ serverName: string; brokers: string; message: string } | null>>;
  setToast: Dispatch<SetStateAction<ToastState>>;
  setStatus: Dispatch<SetStateAction<string>>;
};

type ServerStreamingStopper = (serverId: string, topic: string, pane?: "primary" | "split") => Promise<void>;

export function useServerLifecycleActions({
  kafkaApi,
  servers,
  connectedServerIds,
  openClusterIds,
  selectedServerId,
  streamingTopicsByServer,
  runTask,
  stopConsume,
  refreshTopicsForServer,
  refreshBrokersForServer,
  refreshGroupsForServer,
  setServers,
  setSelectedServerId,
  setConnectedServerIds,
  setFailedServerIds,
  setHealthFailuresByServer,
  setOpenClusterIds,
  setOpenedTopicTabs,
  setSelectedTopic,
  setTopicDetail,
  setTopics,
  setGroups,
  setBrokersByServer,
  setConsumeStates,
  setSplitConsumeStatesByServer,
  setViewByServer,
  setTopicViewByServer,
  setStreamingTopicsByServer,
  setConnectionError,
  setToast,
  setStatus
}: ServerLifecycleActionsParams) {
  const { editingServerId, serverForm, closeServerForm } = useServerFormStore(useShallow((state) => ({
    editingServerId: state.editingServerId,
    serverForm: state.serverForm,
    closeServerForm: state.closeServerForm
  })));

  async function saveServer() {
    if (!kafkaApi) return;
    const nextServers = await runTask("Saving server...", () =>
      kafkaApi.saveServer(buildServerProfileInput(editingServerId, serverForm))
    );
    setServers(nextServers);
    setSelectedServerId(editingServerId ?? nextServers[nextServers.length - 1]?.id ?? "");
    closeServerForm();
  }

  async function deleteServer(id: string) {
    if (!kafkaApi) return;
    const nextServers = await runTask("Deleting server...", () => kafkaApi.deleteServer(id));
    setServers(nextServers);
    removeServerConnectionState(id);
    setSelectedServerId(nextServers[0]?.id ?? "");
    setOpenedTopicTabs([]);
    setSelectedTopic("");
    setTopicDetail(null);
    setConsumeStates({});
    setSplitConsumeStatesByServer((current) => removeServerRecord(current, id));
    setViewByServer((current) => removeServerRecord(current, id));
    setTopicViewByServer((current) => removeServerRecord(current, id));
    setStreamingTopicsByServer((current) => removeServerRecord(current, id));
  }

  async function connectServer(server: ServerProfile) {
    if (!kafkaApi) return false;
    setSelectedServerId(server.id);
    try {
      await runTask("Checking server connection...", async () => {
        await kafkaApi.checkHealth(server.id);
        await refreshTopicsForServer(server.id, undefined, {
          label: "Initializing server...",
          detailLabel: "Initializing server..."
        });
        return true;
      });
      setFailedServerIds((current) => removeId(current, server.id));
      setHealthFailuresByServer((current) => removeServerRecord(current, server.id));
      setConnectedServerIds((current) => addIdOnce(current, server.id));
      setOpenClusterIds((current) => addIdOnce(current, server.id));
      void refreshBrokersForServer(server.id);
      setViewByServer((current) => ({ ...current, [server.id]: current[server.id] ?? "info" }));
      void refreshGroupsForServer(server.id);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectedServerIds((current) => removeId(current, server.id));
      setFailedServerIds((current) => addIdOnce(current, server.id));
      setConnectionError({
        serverName: server.name,
        brokers: server.brokers.join(", "),
        message
      });
      return false;
    }
  }

  async function openCluster(server: ServerProfile) {
    setSelectedServerId(server.id);
    if (connectedServerIds.includes(server.id)) {
      setOpenClusterIds((current) => addIdOnce(current, server.id));
      return true;
    }
    return connectServer(server);
  }

  async function ensureServerConnected(serverId: string) {
    const server = servers.find((item) => item.id === serverId);
    if (!server) return false;
    setSelectedServerId(serverId);
    if (connectedServerIds.includes(serverId)) {
      setOpenClusterIds((current) => addIdOnce(current, serverId));
      return true;
    }
    setToast({ message: `Connecting to ${server.name}...`, kind: "loading" });
    return openCluster(server);
  }

  async function disconnectServer(serverId: string) {
    await stopStreamingTopicsForServer(serverId, streamingTopicsByServer, stopConsume);
    removeServerConnectionState(serverId);
    if (selectedServerId === serverId) {
      clearSelectedServerWorkspace(serverId);
      const nextCluster = openClusterIds.find((id) => id !== serverId) ?? "";
      setSelectedServerId(nextCluster);
    }
  }

  async function closeClusterTab(serverId: string) {
    await stopStreamingTopicsForServer(serverId, streamingTopicsByServer, stopConsume);
    setOpenClusterIds((current) => removeId(current, serverId));
    setFailedServerIds((current) => removeId(current, serverId));
    setHealthFailuresByServer((current) => removeServerRecord(current, serverId));
    if (selectedServerId === serverId) {
      const nextCluster = openClusterIds.find((id) => id !== serverId) ?? "";
      setSelectedServerId(nextCluster);
    }
  }

  async function reorderServer(draggedId: string, targetId: string, position: "before" | "after") {
    if (!kafkaApi) return;
    const nextServers = reorderServers(servers, draggedId, targetId, position);
    if (!nextServers) return;
    setServers(nextServers);
    try {
      const savedServers = await kafkaApi.reorderServers(nextServers.map((server) => server.id));
      setServers(savedServers);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
      const originalServers = await kafkaApi.listServers();
      setServers(originalServers);
    }
  }

  return {
    saveServer,
    deleteServer,
    connectServer,
    openCluster,
    ensureServerConnected,
    disconnectServer,
    closeClusterTab,
    reorderServer
  };

  function removeServerConnectionState(serverId: string) {
    setConnectedServerIds((current) => removeId(current, serverId));
    setFailedServerIds((current) => removeId(current, serverId));
    setHealthFailuresByServer((current) => removeServerRecord(current, serverId));
    setOpenClusterIds((current) => removeId(current, serverId));
  }

  function clearSelectedServerWorkspace(serverId: string) {
    setTopics([]);
    setBrokersByServer((current) => ({ ...current, [serverId]: [] }));
    setGroups([]);
    setOpenedTopicTabs([]);
    setSelectedTopic("");
    setTopicDetail(null);
    setConsumeStates({});
    setSplitConsumeStatesByServer((current) => ({ ...current, [serverId]: {} }));
    setStatus("Disconnected.");
  }
}

async function stopStreamingTopicsForServer(
  serverId: string,
  streamingTopicsByServer: Record<string, string[]>,
  stopConsume: ServerStreamingStopper
) {
  for (const streamingTopic of streamingTopicsByServer[serverId] ?? []) {
    const parsed = readStreamingTopicKey(streamingTopic);
    await stopConsume(serverId, parsed.topic, parsed.pane);
  }
}
