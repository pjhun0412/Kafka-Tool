import type { Dispatch, SetStateAction } from "react";
import type { BrokerSummary, ConsumerGroupSummary, KafkaApi, ServerProfile, TopicSummary } from "../../shared/types";
import { buildServerProfileInput } from "../serverProfileForm";
import { useServerFormStore } from "../stores/ui/serverFormStore";
import type { ToastState, TopicConsumeState, TopicWorkView, View, WorkspaceActionTarget } from "../uiTypes";
import { readStreamingTopicKey } from "../workspaceState";

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

function removeKey<T>(record: Record<string, T>, key: string) {
  const next = { ...record };
  delete next[key];
  return next;
}

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
  const editingServerId = useServerFormStore((state) => state.editingServerId);
  const serverForm = useServerFormStore((state) => state.serverForm);
  const closeServerForm = useServerFormStore((state) => state.closeServerForm);

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
    setConnectedServerIds((current) => current.filter((serverId) => serverId !== id));
    setFailedServerIds((current) => current.filter((serverId) => serverId !== id));
    setOpenClusterIds((current) => current.filter((serverId) => serverId !== id));
    setSelectedServerId(nextServers[0]?.id ?? "");
    setOpenedTopicTabs([]);
    setSelectedTopic("");
    setTopicDetail(null);
    setConsumeStates({});
    setSplitConsumeStatesByServer((current) => removeKey(current, id));
    setViewByServer((current) => removeKey(current, id));
    setTopicViewByServer((current) => removeKey(current, id));
    setStreamingTopicsByServer((current) => removeKey(current, id));
  }

  async function connectServer(server: ServerProfile) {
    if (!kafkaApi) return false;
    setSelectedServerId(server.id);
    try {
      await runTask("서버 연결 확인 중", async () => {
        await kafkaApi.checkHealth(server.id);
        await refreshTopicsForServer(server.id, undefined, {
          label: "서버 초기화 중",
          detailLabel: "서버 초기화 중"
        });
        return true;
      });
      setFailedServerIds((current) => current.filter((serverId) => serverId !== server.id));
      setHealthFailuresByServer((current) => removeKey(current, server.id));
      setConnectedServerIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      setOpenClusterIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      void refreshBrokersForServer(server.id);
      setViewByServer((current) => ({ ...current, [server.id]: current[server.id] ?? "info" }));
      void refreshGroupsForServer(server.id);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setConnectedServerIds((current) => current.filter((serverId) => serverId !== server.id));
      setFailedServerIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
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
      setOpenClusterIds((current) => (current.includes(server.id) ? current : [...current, server.id]));
      return true;
    }
    return connectServer(server);
  }

  async function ensureServerConnected(serverId: string) {
    const server = servers.find((item) => item.id === serverId);
    if (!server) return false;
    setSelectedServerId(serverId);
    if (connectedServerIds.includes(serverId)) {
      setOpenClusterIds((current) => (current.includes(serverId) ? current : [...current, serverId]));
      return true;
    }
    setToast({ message: `Connecting to ${server.name}...`, kind: "loading" });
    return openCluster(server);
  }

  async function disconnectServer(serverId: string) {
    for (const streamingTopic of streamingTopicsByServer[serverId] ?? []) {
      const parsed = readStreamingTopicKey(streamingTopic);
      await stopConsume(serverId, parsed.topic, parsed.pane);
    }
    setConnectedServerIds((current) => current.filter((id) => id !== serverId));
    setFailedServerIds((current) => current.filter((id) => id !== serverId));
    setHealthFailuresByServer((current) => removeKey(current, serverId));
    setOpenClusterIds((current) => current.filter((id) => id !== serverId));
    if (selectedServerId === serverId) {
      setTopics([]);
      setBrokersByServer((current) => ({ ...current, [serverId]: [] }));
      setGroups([]);
      setOpenedTopicTabs([]);
      setSelectedTopic("");
      setTopicDetail(null);
      setConsumeStates({});
      setSplitConsumeStatesByServer((current) => ({ ...current, [serverId]: {} }));
      setStatus("Disconnected.");
      const nextCluster = openClusterIds.find((id) => id !== serverId) ?? "";
      setSelectedServerId(nextCluster);
    }
  }

  async function closeClusterTab(serverId: string) {
    for (const streamingTopic of streamingTopicsByServer[serverId] ?? []) {
      const parsed = readStreamingTopicKey(streamingTopic);
      await stopConsume(serverId, parsed.topic, parsed.pane);
    }
    setOpenClusterIds((current) => current.filter((id) => id !== serverId));
    setFailedServerIds((current) => current.filter((id) => id !== serverId));
    setHealthFailuresByServer((current) => removeKey(current, serverId));
    if (selectedServerId === serverId) {
      const nextCluster = openClusterIds.find((id) => id !== serverId) ?? "";
      setSelectedServerId(nextCluster);
    }
  }

  async function reorderServer(draggedId: string, targetId: string, position: "before" | "after") {
    if (!kafkaApi || draggedId === targetId) return;
    const draggedIndex = servers.findIndex((server) => server.id === draggedId);
    const targetIndex = servers.findIndex((server) => server.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;
    const nextServers = [...servers];
    const [dragged] = nextServers.splice(draggedIndex, 1);
    const adjustedTargetIndex = nextServers.findIndex((server) => server.id === targetId);
    const insertIndex = position === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
    nextServers.splice(insertIndex, 0, dragged);
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
}
