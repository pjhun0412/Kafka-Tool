import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupLagDetail, ConsumerGroupSummary } from "../../../shared/types";
import { emptyProduceDraft, type ProduceDraft } from "../state/useProduceDraftStore";
import type {
  SplitPaneState,
  TopicConsumeState,
  View,
  WorkspaceActionTarget,
  WorkspacePaneId
} from "../../uiTypes";
import { workspaceMessages } from "../../workspaceMessages";
import { buildConsumeResetState, clearGroupSelectionForServer } from "./workspaceRefreshUtils";

type WorkspaceRefreshActionsParams = {
  activeWorkspacePane: WorkspacePaneId;
  selectedServerId: string;
  selectedTopic: string;
  view: View;
  visibleSplitPane: SplitPaneState | null;
  selectedConsumeState: TopicConsumeState;
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
  selectedConsumeState,
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
      clearGroupSelectionForServer(selectedServerId, setSelectedGroupByServer, setGroupLagByServer);
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
      updateSelectedConsumeState(buildConsumeResetState(selectedDefaultConsumeState, selectedConsumeState));
      setStatus(workspaceMessages.consumeReset);
      if (pane) {
        showPaneToast(pane, workspaceMessages.consumeReset, "success", { serverId: selectedServerId, topic: selectedTopic });
      }
      return;
    }
    if (view === "settings") {
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
      clearGroupSelectionForServer(pane.serverId, setSelectedGroupByServer, setGroupLagByServer);
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
      updateConsumeStateFor(pane.serverId, pane.topic, buildConsumeResetState(getDefaultConsumeState(pane.serverId), state), "split");
      setStatus(workspaceMessages.consumeReset);
      showPaneToast("split", workspaceMessages.consumeReset, "success", { serverId: pane.serverId, topic: pane.topic });
      return;
    }
    if (pane.view === "produce") {
      updateProduceDraftFor(pane.serverId, pane.topic, emptyProduceDraft);
      setStatus(workspaceMessages.produceReset);
      showPaneToast("split", workspaceMessages.produceReset, "success", { serverId: pane.serverId, topic: pane.topic });
      return;
    }
    if (pane.view === "settings") {
      return;
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
