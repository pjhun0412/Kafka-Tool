import type { Dispatch, SetStateAction } from "react";
import type { KafkaApi, TopicDetail } from "../../shared/types";
import type { TopicWorkView, View, WorkspaceActionTarget } from "../uiTypes";
import { addTopicTab } from "../workspaceState";
import { workspaceMessages } from "../workspaceMessages";

type PrimaryTopicNavigationActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  getWorkspaceTargetForServer: (serverId?: string, topic?: string) => WorkspaceActionTarget;
  getTopicViewFor: (serverId: string, topic: string) => TopicWorkView;
  getCachedTopicDetail: (serverId: string, topic: string) => TopicDetail | null;
  setTopicDetailForServer: (serverId: string, detail: TopicDetail | null) => void;
  activateSplitTopic: (topic: string, view?: TopicWorkView) => Promise<void>;
  loadTopicDetailSilent: (topic: string) => Promise<void>;
  runWorkspaceTask: <T>(target: WorkspaceActionTarget, label: string, task: () => Promise<T>) => Promise<T>;
  setActiveWorkspacePane: Dispatch<SetStateAction<"primary" | "split">>;
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setOpenClusterIds: Dispatch<SetStateAction<string[]>>;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setSelectedTopicByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setSelectedTopic: (topic: string) => void;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
};

export function usePrimaryTopicNavigationActions({
  kafkaApi,
  selectedServerId,
  getWorkspaceTargetForServer,
  getTopicViewFor,
  getCachedTopicDetail,
  setTopicDetailForServer,
  activateSplitTopic,
  loadTopicDetailSilent,
  runWorkspaceTask,
  setActiveWorkspacePane,
  setSelectedServerId,
  setOpenClusterIds,
  setOpenedTopicTabsByServer,
  setSelectedTopicByServer,
  setSelectedTopic,
  setViewByServer,
  setTopicViewByServer
}: PrimaryTopicNavigationActionsParams) {
  async function selectPrimaryTopic(topic: string) {
    if (!selectedServerId || !topic) return;
    const nextView = getTopicViewFor(selectedServerId, topic);
    setActiveWorkspacePane("primary");
    setSelectedTopic(topic);
    setViewByServer((current) => ({ ...current, [selectedServerId]: nextView }));
    if (nextView === "info") {
      await loadTopicDetailSilent(topic);
    }
  }

  async function selectTopicInWorkspace(target: WorkspaceActionTarget, topic: string) {
    if (!topic) return;
    if (target.pane === "split") {
      await activateSplitTopic(topic);
      return;
    }
    const nextView = getTopicViewFor(target.serverId, topic);
    setActiveWorkspacePane("primary");
    setSelectedServerId(target.serverId);
    setSelectedTopicByServer((current) => ({ ...current, [target.serverId]: topic }));
    setViewByServer((current) => ({ ...current, [target.serverId]: nextView }));
    if (nextView === "info" && kafkaApi) {
      const cachedDetail = getCachedTopicDetail(target.serverId, topic);
      if (cachedDetail) {
        setTopicDetailForServer(target.serverId, cachedDetail);
        return;
      }
      const detail = await runWorkspaceTask(
        { pane: "primary", serverId: target.serverId, topic },
        workspaceMessages.topicDetailLoading,
        () => kafkaApi.getTopicDetail(target.serverId, topic)
      );
      setTopicDetailForServer(target.serverId, detail);
    }
  }

  async function openTopicInWorkspace(
    target: WorkspaceActionTarget,
    topic: string,
    nextView: TopicWorkView = getTopicViewFor(target.serverId, topic)
  ) {
    if (!topic) return;
    if (target.pane === "split") {
      await activateSplitTopic(topic, nextView);
      return;
    }
    setActiveWorkspacePane("primary");
    setSelectedServerId(target.serverId);
    setOpenClusterIds((current) => (current.includes(target.serverId) ? current : [...current, target.serverId]));
    setOpenedTopicTabsByServer((current) => {
      const tabs = current[target.serverId] ?? [];
      return { ...current, [target.serverId]: addTopicTab(tabs, topic) };
    });
    setSelectedTopicByServer((current) => ({ ...current, [target.serverId]: topic }));
    setViewByServer((current) => ({ ...current, [target.serverId]: nextView }));
    setTopicViewByServer((current) => ({
      ...current,
      [target.serverId]: {
        ...(current[target.serverId] ?? {}),
        [topic]: nextView
      }
    }));
    if (nextView === "info" && kafkaApi) {
      const cachedDetail = getCachedTopicDetail(target.serverId, topic);
      if (cachedDetail) {
        setTopicDetailForServer(target.serverId, cachedDetail);
        return;
      }
      const detail = await runWorkspaceTask(
        { pane: "primary", serverId: target.serverId, topic },
        workspaceMessages.topicDetailLoading,
        () => kafkaApi.getTopicDetail(target.serverId, topic)
      );
      setTopicDetailForServer(target.serverId, detail);
    }
  }

  async function openTopicTab(topic: string) {
    await openTopicInWorkspace(getWorkspaceTargetForServer(selectedServerId, topic), topic);
  }

  return {
    selectPrimaryTopic,
    selectTopicInWorkspace,
    openTopicInWorkspace,
    openTopicTab
  };
}
