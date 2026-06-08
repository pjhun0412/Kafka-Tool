import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupLagDetail, ConsumerGroupSummary } from "../../shared/types";
import { emptyProduceDraft, type ProduceDraft } from "./useProduceDraftStore";
import type {
  SplitPaneState,
  TopicConsumeState,
  View,
  WorkspaceActionTarget,
  WorkspacePaneId
} from "../uiTypes";
import { workspaceMessages } from "../workspaceMessages";

type WorkspaceRefreshActionsParams = {
  activeWorkspacePane: WorkspacePaneId;
  selectedServerId: string;
  selectedTopic: string;
  view: View;
  visibleSplitPane: SplitPaneState | null;
  splitConsumeState: TopicConsumeState;
  selectedDefaultConsumeState: TopicConsumeState;
  refreshBrokers: () => Promise<void>;
  refreshBrokersForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  refreshTopics: () => Promise<void>;
  refreshTopicsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshGroupsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  loadTopicDetail: (topic: string) => Promise<void>;
  loadTopicDetailSilent: (topic: string, options?: { force?: boolean }) => Promise<void>;
  loadSplitTopicDetailSilent: (serverId: string, topic: string, options?: { force?: boolean }) => Promise<void>;
  isTopicStreaming: (serverId: string, topic: string, pane: WorkspacePaneId) => boolean;
  stopConsume: (serverId?: string, topic?: string, pane?: WorkspacePaneId) => Promise<void>;
  getDefaultConsumeState: (serverId?: string) => TopicConsumeState;
  updateSelectedConsumeState: (patch: Partial<TopicConsumeState>) => void;
  updateConsumeStateFor: (serverId: string, topic: string, patch: Partial<TopicConsumeState>, pane?: WorkspacePaneId) => void;
  updateProduceDraftFor: (serverId: string, topic: string, patch: ProduceDraft) => void;
  runPaneTask: <T>(
    pane: WorkspacePaneId,
    label: string,
    task: () => Promise<T>,
    scope?: { serverId?: string; topic?: string }
  ) => Promise<T>;
  showPaneToast: (
    pane: WorkspacePaneId,
    message: string,
    kind?: "success" | "error",
    scope?: { serverId?: string; topic?: string }
  ) => void;
  setGroups: (groups: ConsumerGroupSummary[]) => void;
  setSelectedGroupByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setGroupLagByServer: Dispatch<SetStateAction<Record<string, Record<string, ConsumerGroupLagDetail>>>>;
  setStatus: (status: string) => void;
};

export function useWorkspaceRefreshActions({
  activeWorkspacePane,
  selectedServerId,
  selectedTopic,
  view,
  visibleSplitPane,
  splitConsumeState,
  selectedDefaultConsumeState,
  refreshBrokers,
  refreshBrokersForServer,
  refreshTopics,
  refreshTopicsForServer,
  refreshGroups,
  refreshGroupsForServer,
  loadTopicDetail,
  loadTopicDetailSilent,
  loadSplitTopicDetailSilent,
  isTopicStreaming,
  stopConsume,
  getDefaultConsumeState,
  updateSelectedConsumeState,
  updateConsumeStateFor,
  updateProduceDraftFor,
  runPaneTask,
  showPaneToast,
  setGroups,
  setSelectedGroupByServer,
  setGroupLagByServer,
  setStatus
}: WorkspaceRefreshActionsParams) {
  async function refreshCurrentView(pane?: WorkspacePaneId) {
    const target = pane ? { pane, serverId: selectedServerId, topic: selectedTopic } satisfies WorkspaceActionTarget : undefined;
    if (view === "brokers") {
      if (target) {
        await refreshBrokersForServer(selectedServerId, target);
      } else {
        await refreshBrokers();
      }
      return;
    }
    if (view === "topics") {
      if (target) {
        await refreshTopicsForServer(selectedServerId, target);
      } else {
        await refreshTopics();
      }
      return;
    }
    if (view === "consumers") {
      setGroups([]);
      setSelectedGroupByServer((current) => ({ ...current, [selectedServerId]: "" }));
      setGroupLagByServer((current) => ({ ...current, [selectedServerId]: {} }));
      if (target) {
        await refreshGroupsForServer(selectedServerId, target);
      } else {
        await refreshGroups();
      }
      return;
    }
    if (view === "info") {
      if (selectedTopic) {
        if (pane) {
          await runPaneTask(
            pane,
            workspaceMessages.topicDetailLoading,
            () => loadTopicDetailSilent(selectedTopic, { force: true }),
            { serverId: selectedServerId, topic: selectedTopic }
          );
          return;
        }
        await loadTopicDetail(selectedTopic);
      }
      return;
    }
    if (view === "consume") {
      if (!selectedTopic) return;
      if (isTopicStreaming(selectedServerId, selectedTopic, "primary")) {
        await stopConsume(selectedServerId, selectedTopic, "primary");
      }
      updateSelectedConsumeState(selectedDefaultConsumeState);
      setStatus("실시간 consume 중");
      if (pane) {
        showPaneToast(pane, workspaceMessages.consumeReset, "success", { serverId: selectedServerId, topic: selectedTopic });
      }
      return;
    }
    updateProduceDraftFor(selectedServerId, selectedTopic, emptyProduceDraft);
    setStatus(workspaceMessages.produceReset);
    if (pane) {
      showPaneToast(pane, workspaceMessages.produceReset, "success", { serverId: selectedServerId, topic: selectedTopic });
    }
  }

  async function refreshSplitPaneView(pane: SplitPaneState, state: TopicConsumeState) {
    if (pane.view === "brokers") {
      await refreshBrokersForServer(pane.serverId, { pane: "split", serverId: pane.serverId, topic: pane.topic });
      return;
    }
    if (pane.view === "topics") {
      await refreshTopicsForServer(pane.serverId, { pane: "split", serverId: pane.serverId, topic: pane.topic });
      return;
    }
    if (pane.view === "consumers") {
      setSelectedGroupByServer((current) => ({ ...current, [pane.serverId]: "" }));
      setGroupLagByServer((current) => ({ ...current, [pane.serverId]: {} }));
      await refreshGroupsForServer(pane.serverId, { pane: "split", serverId: pane.serverId, topic: pane.topic });
      return;
    }
    if (pane.view === "info") {
      if (pane.topic) {
        await runPaneTask(
          "split",
          workspaceMessages.topicDetailLoading,
          () => loadSplitTopicDetailSilent(pane.serverId, pane.topic, { force: true }),
          { serverId: pane.serverId, topic: pane.topic }
        );
      }
      return;
    }
    if (pane.view === "consume") {
      if (!pane.topic) return;
      if (isTopicStreaming(pane.serverId, pane.topic, "split")) {
        await stopConsume(pane.serverId, pane.topic, "split");
      }
      updateConsumeStateFor(pane.serverId, pane.topic, {
        ...getDefaultConsumeState(pane.serverId),
        mode: state.mode,
        offsetOrder: state.offsetOrder,
        partition: state.partition,
        limit: state.limit,
        autoScroll: state.autoScroll,
        maxMessages: state.maxMessages,
        messagePaneHeight: state.messagePaneHeight
      }, "split");
      setStatus(workspaceMessages.consumeReset);
      showPaneToast("split", workspaceMessages.consumeReset, "success", { serverId: pane.serverId, topic: pane.topic });
      return;
    }
    if (pane.view === "produce") {
      updateProduceDraftFor(pane.serverId, pane.topic, emptyProduceDraft);
      setStatus(workspaceMessages.produceReset);
      showPaneToast("split", workspaceMessages.produceReset, "success", { serverId: pane.serverId, topic: pane.topic });
    }
  }

  async function refreshActiveWorkspaceView() {
    if (visibleSplitPane && activeWorkspacePane === "split") {
      await refreshSplitPaneView(visibleSplitPane, splitConsumeState);
      return;
    }
    await refreshCurrentView("primary");
  }

  return {
    refreshCurrentView,
    refreshSplitPaneView,
    refreshActiveWorkspaceView
  };
}
