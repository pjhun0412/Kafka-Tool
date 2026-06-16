import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerInteractionsParams } from "../useWorkspaceControllerInteractions";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type InteractionDerived = Pick<
  WorkspaceControllerInteractionsParams["consume"],
  "selectedConsumeState" | "selectedDefaultConsumeState" | "selectedTopic" | "splitConsumeState" | "view" | "visibleSplitPane"
> &
  Pick<
    WorkspaceControllerInteractionsParams["quickSearch"],
    "isQuickSearchOpen" | "quickSearchIndex" | "quickSearchResults"
  > &
  Pick<WorkspaceControllerInteractionsParams["topicTabs"], "openedTopicTabs" | "previewTopic">;

type InteractionActions = Pick<
  WorkspaceControllerInteractionsParams["quickSearch"],
  | "closeQuickSearch"
  | "closeSplitPane"
  | "ensureServerConnected"
  | "getWorkspaceTargetForServer"
  | "loadConsumerGroupLagFor"
  | "openManualAvroSchema"
  | "openQuickSearch"
  | "openSplitForTopic"
  | "openTopicInWorkspace"
  | "refreshGroups"
  | "refreshGroupsForServer"
  | "refreshTopics"
  | "rememberQuickSearch"
  | "requestTopicAction"
  | "requestTopicActionFor"
  | "setQuickSearchIndex"
  | "setView"
> &
  Pick<
    WorkspaceControllerInteractionsParams["consume"],
    | "loadSplitTopicDetailSilent"
    | "loadTopicDetail"
    | "loadTopicDetailSilent"
    | "refreshBrokers"
    | "refreshBrokersForServer"
    | "refreshTopicsForServer"
    | "runPaneTask"
    | "showPaneToast"
    | "stopConsume"
  > &
  Pick<
    WorkspaceControllerInteractionsParams["consume"],
    "isTopicStreaming" | "setGroups"
  > &
  Pick<
    WorkspaceControllerInteractionsParams["topicTabs"],
    "promoteSplitPaneToPrimary" | "selectPrimaryTopic" | "setOpenedTopicTabs" | "setSelectedTopic" | "setTopicDetail"
  >;

export function createWorkspaceInteractionParams({
  state,
  derived,
  actions
}: {
  state: ControllerState;
  derived: InteractionDerived;
  actions: InteractionActions;
}): WorkspaceControllerInteractionsParams {
  return {
    quickSearch: {
      quickSearchResults: derived.quickSearchResults,
      quickSearchIndex: derived.quickSearchIndex,
      quickSearchResultCount: derived.quickSearchResults.length,
      selectedServerId: state.selectedServerId,
      selectedTopic: derived.selectedTopic,
      splitPaneOpen: Boolean(derived.visibleSplitPane),
      keyboardShortcuts: state.keyboardShortcuts,
      groupsByServer: state.groupsByServer,
      ensureServerConnected: actions.ensureServerConnected,
      getWorkspaceTargetForServer: actions.getWorkspaceTargetForServer,
      openTopicInWorkspace: actions.openTopicInWorkspace,
      openSplitForTopic: actions.openSplitForTopic,
      openManualAvroSchema: actions.openManualAvroSchema,
      openPreferences: state.openPreferences,
      refreshTopics: actions.refreshTopics,
      refreshGroups: actions.refreshGroups,
      refreshGroupsForServer: actions.refreshGroupsForServer,
      loadConsumerGroupLagFor: actions.loadConsumerGroupLagFor,
      requestTopicAction: actions.requestTopicAction,
      requestTopicActionFor: actions.requestTopicActionFor,
      rememberQuickSearch: actions.rememberQuickSearch,
      closeQuickSearch: actions.closeQuickSearch,
      setSelectedServerId: state.setSelectedServerId,
      setView: actions.setView,
      setViewByServer: state.setViewByServer,
      isQuickSearchOpen: derived.isQuickSearchOpen,
      openQuickSearch: actions.openQuickSearch,
      closeSplitPane: actions.closeSplitPane,
      setActiveWorkspacePane: state.setActiveWorkspacePane,
      setSidebarCollapsed: state.setSidebarCollapsed,
      setQuickSearchIndex: actions.setQuickSearchIndex
    },
    manualAvro: {
      manualAvroSchemasByServer: state.manualAvroSchemasByServer,
      servers: state.servers,
      selectedServerId: state.selectedServerId
    },
    consume: {
      selectedServerId: state.selectedServerId,
      selectedTopic: derived.selectedTopic,
      selectedDefaultConsumeState: derived.selectedDefaultConsumeState,
      setConsumeStates: state.setConsumeStates,
      rememberViewerPreference: state.rememberViewerPreference,
      setConsumeDefaultsByServer: state.setConsumeDefaultsByServer,
      activeWorkspacePane: state.activeWorkspacePane,
      view: derived.view,
      visibleSplitPane: derived.visibleSplitPane,
      selectedConsumeState: derived.selectedConsumeState,
      splitConsumeState: derived.splitConsumeState,
      refreshBrokers: actions.refreshBrokers,
      refreshBrokersForServer: actions.refreshBrokersForServer,
      refreshTopics: actions.refreshTopics,
      refreshTopicsForServer: actions.refreshTopicsForServer,
      refreshGroups: actions.refreshGroups,
      refreshGroupsForServer: actions.refreshGroupsForServer,
      loadTopicDetail: actions.loadTopicDetail,
      loadTopicDetailSilent: actions.loadTopicDetailSilent,
      loadSplitTopicDetailSilent: actions.loadSplitTopicDetailSilent,
      isTopicStreaming: actions.isTopicStreaming,
      stopConsume: actions.stopConsume,
      getDefaultConsumeState: state.getDefaultConsumeState,
      updateConsumeStateFor: state.updateConsumeStateFor,
      updateProduceDraftFor: state.updateProduceDraftFor,
      runPaneTask: actions.runPaneTask,
      showPaneToast: actions.showPaneToast,
      setGroups: actions.setGroups,
      setSelectedGroupByServer: state.setSelectedGroupByServer,
      setGroupLagByServer: state.setGroupLagByServer,
      setStatus: state.setStatus
    },
    topicTabs: {
      selectedServerId: state.selectedServerId,
      selectedTopic: derived.selectedTopic,
      openedTopicTabs: derived.openedTopicTabs,
      previewTopic: derived.previewTopic,
      splitPane: state.splitPane,
      isTopicStreaming: actions.isTopicStreaming,
      stopConsume: actions.stopConsume,
      clearConsumeStateForPane: state.clearConsumeStateForPane,
      promoteSplitPaneToPrimary: actions.promoteSplitPaneToPrimary,
      selectPrimaryTopic: actions.selectPrimaryTopic,
      setOpenedTopicTabs: actions.setOpenedTopicTabs,
      setPreviewTopicByServer: state.setPreviewTopicByServer,
      setSelectedTopic: actions.setSelectedTopic,
      setTopicDetail: actions.setTopicDetail,
      setViewByServer: state.setViewByServer
    }
  };
}
