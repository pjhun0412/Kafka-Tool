import type { Dispatch, SetStateAction } from "react";
import type { KafkaApi, TopicDetail } from "../../shared/types";
import type { SplitPaneState, TopicConsumeState, TopicWorkView, View, WorkspacePaneId } from "../uiTypes";
import {
  clearServerConsumeStates,
  closeTopicInSplitPane,
  createSplitPaneForTopic,
  getNextTopicAfterTabClose,
  mergeTopicConsumeStates,
  mergeTopicTabs,
  removeTopicTab
} from "../workspaceState";
import { isTopicWorkView } from "../utils";

type ConsumeStatesByServer = Record<string, Record<string, TopicConsumeState>>;

type SplitPaneActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  selectedTopic: string;
  openedTopicTabs: string[];
  splitPane: SplitPaneState | null;
  splitConsumeStatesByServer: ConsumeStatesByServer;
  topicDetailByServer: Record<string, TopicDetail | null>;
  getTopicViewFor: (serverId: string, topic: string) => TopicWorkView;
  getCachedTopicDetail: (serverId: string, topic: string) => TopicDetail | null;
  setTopicDetailForServer: (serverId: string, detail: TopicDetail | null) => void;
  isTopicStreaming: (serverId: string, topic: string, pane: WorkspacePaneId) => boolean;
  stopConsume: (serverId?: string, topic?: string, pane?: WorkspacePaneId) => Promise<void>;
  moveConsumeStateBetweenPanes: (serverId: string, topic: string, from: WorkspacePaneId, to: WorkspacePaneId) => void;
  retargetLiveTopic: (serverId: string, topic: string, from: WorkspacePaneId, to: WorkspacePaneId) => void;
  clearConsumeStatesForPane: (serverId: string, topicsToClear: Iterable<string>, pane: WorkspacePaneId) => void;
  clearConsumeStateForPane: (serverId: string, topic: string, pane: WorkspacePaneId) => void;
  loadSplitTopicDetailSilent: (serverId: string, topic: string, options?: { force?: boolean }) => Promise<void>;
  selectPrimaryTopic: (topic: string) => Promise<void>;
  setOpenedTopicTabs: (action: string[] | ((current: string[]) => string[])) => void;
  setSelectedTopic: (topic: string) => void;
  setTopicDetail: (detail: TopicDetail | null) => void;
  setSplitPane: Dispatch<SetStateAction<SplitPaneState | null>>;
  setActiveWorkspacePane: Dispatch<SetStateAction<WorkspacePaneId>>;
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setSelectedTopicByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
  setConsumeStatesByServer: Dispatch<SetStateAction<ConsumeStatesByServer>>;
  setSplitConsumeStatesByServer: Dispatch<SetStateAction<ConsumeStatesByServer>>;
};

export function useSplitPaneActions({
  kafkaApi,
  selectedServerId,
  selectedTopic,
  openedTopicTabs,
  splitPane,
  splitConsumeStatesByServer,
  topicDetailByServer,
  getTopicViewFor,
  getCachedTopicDetail,
  setTopicDetailForServer,
  isTopicStreaming,
  stopConsume,
  moveConsumeStateBetweenPanes,
  retargetLiveTopic,
  clearConsumeStatesForPane,
  clearConsumeStateForPane,
  loadSplitTopicDetailSilent,
  selectPrimaryTopic,
  setOpenedTopicTabs,
  setSelectedTopic,
  setTopicDetail,
  setSplitPane,
  setActiveWorkspacePane,
  setSelectedServerId,
  setOpenedTopicTabsByServer,
  setSelectedTopicByServer,
  setViewByServer,
  setTopicViewByServer,
  setConsumeStatesByServer,
  setSplitConsumeStatesByServer
}: SplitPaneActionsParams) {
  async function openSplitForTopic(serverId: string, topic: string) {
    if (!topic || serverId !== selectedServerId) return;
    const nextView = getTopicViewFor(serverId, topic);
    const existingDetail = getCachedTopicDetail(serverId, topic) ?? (topicDetailByServer[serverId]?.name === topic ? topicDetailByServer[serverId] : null);
    const isAlreadyOpenInSplit = splitPane?.serverId === serverId && splitPane.topicTabs.includes(topic);
    const isStreamingInPrimary = isTopicStreaming(serverId, topic, "primary");
    if (isStreamingInPrimary && isAlreadyOpenInSplit) {
      await stopConsume(serverId, topic, "primary");
    }
    moveConsumeStateBetweenPanes(serverId, topic, "primary", "split");
    if (isStreamingInPrimary && !isAlreadyOpenInSplit) {
      retargetLiveTopic(serverId, topic, "primary", "split");
    }
    setSplitPane((current) => createSplitPaneForTopic(current, serverId, topic, nextView, existingDetail));
    setActiveWorkspacePane("split");
    if (nextView === "info" && !existingDetail) {
      await loadSplitTopicDetailSilent(serverId, topic);
    }
  }

  async function openPrimaryTopicTab(topic: string) {
    setOpenedTopicTabs((current) => addUniqueTopicTab(current, topic));
    await selectPrimaryTopic(topic);
  }

  async function moveSplitTopicToPrimary(topic: string) {
    const pane = splitPane;
    if (!pane || pane.serverId !== selectedServerId || !pane.topicTabs.includes(topic)) return;
    const isAlreadyOpenInPrimary = openedTopicTabs.includes(topic);
    const isStreamingInSplit = isTopicStreaming(pane.serverId, topic, "split");
    if (isStreamingInSplit && isAlreadyOpenInPrimary) {
      await stopConsume(pane.serverId, topic, "split");
    }
    moveConsumeStateBetweenPanes(pane.serverId, topic, "split", "primary");
    if (isStreamingInSplit && !isAlreadyOpenInPrimary) {
      retargetLiveTopic(pane.serverId, topic, "split", "primary");
    }
    await openPrimaryTopicTab(topic);
    await removeSplitTopicTabAfterMove(topic);
  }

  async function removePrimaryTopicTabAfterSplit(topic: string) {
    if (!openedTopicTabs.includes(topic)) return;
    const nextTabs = removeTopicTab(openedTopicTabs, topic);
    setOpenedTopicTabs(nextTabs);
    if (selectedTopic !== topic) return;
    const nextTopic = getNextTopicAfterTabClose(selectedTopic, topic, nextTabs);
    if (nextTopic) {
      await selectPrimaryTopic(nextTopic);
      return;
    }
    setSelectedTopic("");
    setTopicDetail(null);
    setViewByServer((current) => ({ ...current, [selectedServerId]: "topics" }));
  }

  async function closeSplitPane() {
    const pane = splitPane;
    if (!pane) return;
    for (const topic of pane.topicTabs) {
      if (isTopicStreaming(pane.serverId, topic, "split")) {
        await stopConsume(pane.serverId, topic, "split");
      }
    }
    clearConsumeStatesForPane(pane.serverId, pane.topicTabs, "split");
    setSplitPane(null);
    setActiveWorkspacePane("primary");
  }

  async function closeSplitTopicTab(topic: string) {
    const pane = splitPane;
    if (!pane) return;
    if (isTopicStreaming(pane.serverId, topic, "split")) {
      await stopConsume(pane.serverId, topic, "split");
    }
    clearConsumeStateForPane(pane.serverId, topic, "split");
    await applySplitTopicClose(pane, topic);
  }

  async function removeSplitTopicTabAfterMove(topic: string) {
    const pane = splitPane;
    if (!pane) return;
    await applySplitTopicClose(pane, topic);
  }

  async function applySplitTopicClose(pane: SplitPaneState, topic: string) {
    const result = closeTopicInSplitPane(pane, topic, (nextTopic) => getTopicViewFor(pane.serverId, nextTopic));
    if (!result.pane) {
      setSplitPane(null);
      setActiveWorkspacePane("primary");
      return;
    }
    setSplitPane(result.pane);
    if (result.nextTopic && result.nextView === "info" && result.closedActiveTopic) {
      await loadSplitTopicDetailSilent(pane.serverId, result.nextTopic);
    }
  }

  async function promoteSplitPaneToPrimary() {
    const pane = splitPane;
    if (!pane || pane.serverId !== selectedServerId) return false;
    const nextTopic = pane.topic || (pane.topicTabs[pane.topicTabs.length - 1] ?? "");
    if (!nextTopic) {
      setSplitPane(null);
      setActiveWorkspacePane("primary");
      return true;
    }
    const nextView = isTopicWorkView(pane.view) ? pane.view : getTopicViewFor(pane.serverId, nextTopic);
    setSelectedServerId(pane.serverId);
    setOpenedTopicTabsByServer((current) => {
      const existingTabs = current[pane.serverId] ?? [];
      return { ...current, [pane.serverId]: mergeTopicTabs(existingTabs, pane.topicTabs) };
    });
    setSelectedTopicByServer((current) => ({ ...current, [pane.serverId]: nextTopic }));
    setViewByServer((current) => ({ ...current, [pane.serverId]: nextView }));
    setTopicViewByServer((current) => {
      const nextViews = { ...(current[pane.serverId] ?? {}) };
      for (const topic of pane.topicTabs) {
        nextViews[topic] = topic === nextTopic ? nextView : nextViews[topic] ?? getTopicViewFor(pane.serverId, topic);
      }
      return { ...current, [pane.serverId]: nextViews };
    });
    setConsumeStatesByServer((current) => mergeTopicConsumeStates(current, pane.serverId, splitConsumeStatesByServer[pane.serverId] ?? {}));
    setSplitConsumeStatesByServer((current) => clearServerConsumeStates(current, pane.serverId));
    for (const topic of pane.topicTabs) {
      if (isTopicStreaming(pane.serverId, topic, "split")) {
        retargetLiveTopic(pane.serverId, topic, "split", "primary");
      }
    }
    const cachedDetail = getCachedTopicDetail(pane.serverId, nextTopic);
    const nextDetail = pane.topic === nextTopic ? pane.detail ?? cachedDetail : cachedDetail;
    if (nextDetail) {
      setTopicDetailForServer(pane.serverId, nextDetail);
    } else if (nextView === "info" && kafkaApi) {
      const detail = await kafkaApi.getTopicDetail(pane.serverId, nextTopic);
      setTopicDetailForServer(pane.serverId, detail);
    } else {
      setTopicDetailForServer(pane.serverId, null);
    }
    setSplitPane(null);
    setActiveWorkspacePane("primary");
    return true;
  }

  return {
    openSplitForTopic,
    moveSplitTopicToPrimary,
    removePrimaryTopicTabAfterSplit,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary
  };
}

function addUniqueTopicTab(tabs: string[], topic: string) {
  return tabs.includes(topic) ? tabs : [...tabs, topic];
}
