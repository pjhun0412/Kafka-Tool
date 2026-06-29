import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerPanesParams } from "../workspaceControllerPaneTypes";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type PaneDerived = Pick<
  WorkspaceControllerPanesParams["context"],
  "activeWorkspaceView" | "isSelectedServerConnected" | "selectedServer" | "selectedTopic" | "view" | "visibleSplitPane"
> &
  Pick<
    WorkspaceControllerPanesParams["resources"],
    | "manualAvroTopicNames"
    | "openedTopicTabs"
    | "previewTopic"
    | "selectedTopicRows"
    | "sortedTopics"
    | "topicDetail"
    | "updateTopicGridSortingForServer"
  > &
  Pick<WorkspaceControllerPanesParams["models"], "primaryModel" | "primaryPaneToast" | "splitModel" | "splitPaneToast" | "splitServer"> &
  Pick<WorkspaceControllerPanesParams["consume"], "selectedConsumeState" | "splitConsumeState"> &
  Pick<WorkspaceControllerPanesParams["produce"], "selectedProduceDraft" | "splitProduceDraft">;

type PaneActions = Omit<
  WorkspaceControllerPanesParams["callbacks"],
  "setActiveWorkspacePane" | "setSelectedGroupByServer" | "setSidebarCollapsed"
> &
  Pick<
    WorkspaceControllerPanesParams["consume"],
    | "exportConsumedMessages"
    | "exportOffsetConditionMessages"
    | "isConsumeTaskActive"
    | "isTopicStreaming"
    | "moveOffsetPageFor"
    | "sendMessageToProduce"
    | "startConsume"
    | "startConsumeFor"
    | "stopConsume"
    | "updateConsumeDefaults"
    | "updateConsumeStateFor"
    | "updateSelectedConsumeState"
  > &
  Pick<WorkspaceControllerPanesParams["produce"], "produce" | "produceFor" | "updateProduceDraftFor">;

export function createWorkspacePaneParams({
  state,
  derived,
  actions,
  language
}: {
  state: ControllerState;
  derived: PaneDerived;
  actions: PaneActions;
  language: WorkspaceControllerPanesParams["context"]["language"];
}): WorkspaceControllerPanesParams {
  return {
    context: {
      activeWorkspacePane: state.activeWorkspacePane,
      activeWorkspaceView: derived.activeWorkspaceView,
      isSelectedServerConnected: derived.isSelectedServerConnected,
      language,
      messagePaneHeight: state.messagePaneHeight,
      openClusterIds: state.openClusterIds,
      selectedServer: derived.selectedServer,
      selectedServerId: state.selectedServerId,
      selectedTopic: derived.selectedTopic,
      setSelectedServerId: state.setSelectedServerId,
      sidebarCollapsed: state.sidebarCollapsed,
      view: derived.view,
      visibleSplitPane: derived.visibleSplitPane
    },
    resources: {
      connectedServerIds: state.connectedServerIds,
      failedServerIds: state.failedServerIds,
      favoriteTopicNames: state.favoriteTopicsByServer[state.selectedServerId] ?? [],
      groupLagByServer: state.groupLagByServer,
      loading: state.loading,
      manualAvroSchemasByServer: state.manualAvroSchemasByServer,
      manualAvroTopicNames: derived.manualAvroTopicNames,
      openedTopicTabs: derived.openedTopicTabs,
      previewTopic: derived.previewTopic,
      produceTemplatesByServer: state.produceTemplatesByServer,
      selectedTopicRows: derived.selectedTopicRows,
      servers: state.servers,
      setProduceTemplatesByServer: state.setProduceTemplatesByServer,
      sortedTopics: derived.sortedTopics,
      topicsByServer: state.topicsByServer,
      topicDetail: derived.topicDetail,
      topicGridSortingByServer: state.topicGridSortingByServer,
      updateTopicGridSortingForServer: derived.updateTopicGridSortingForServer
    },
    models: {
      primaryModel: derived.primaryModel,
      primaryPaneToast: derived.primaryPaneToast,
      splitModel: derived.splitModel,
      splitPane: state.splitPane,
      splitPaneToast: derived.splitPaneToast,
      splitServer: derived.splitServer
    },
    consume: {
      exportConsumedMessages: actions.exportConsumedMessages,
      exportOffsetConditionMessages: actions.exportOffsetConditionMessages,
      isConsumeTaskActive: actions.isConsumeTaskActive,
      isTopicStreaming: actions.isTopicStreaming,
      moveOffsetPageFor: actions.moveOffsetPageFor,
      selectedConsumeState: derived.selectedConsumeState,
      sendMessageToProduce: actions.sendMessageToProduce,
      splitConsumeState: derived.splitConsumeState,
      startConsume: actions.startConsume,
      startConsumeFor: actions.startConsumeFor,
      stopConsume: actions.stopConsume,
      updateConsumeDefaults: actions.updateConsumeDefaults,
      updateConsumeStateFor: actions.updateConsumeStateFor,
      updateSelectedConsumeState: actions.updateSelectedConsumeState
    },
    produce: {
      produce: actions.produce,
      produceFor: actions.produceFor,
      selectedProduceDraft: derived.selectedProduceDraft,
      splitProduceDraft: derived.splitProduceDraft,
      updateProduceDraftFor: actions.updateProduceDraftFor
    },
    callbacks: {
      activateSplitTopic: actions.activateSplitTopic,
      clearDragPayload: actions.clearDragPayload,
      closeClusterTab: actions.closeClusterTab,
      closeSplitPane: actions.closeSplitPane,
      closeSplitTopicTab: actions.closeSplitTopicTab,
      closeTopicTab: actions.closeTopicTab,
      copySelectedTopicNames: actions.copySelectedTopicNames,
      deleteConsumerGroupsFor: actions.deleteConsumerGroupsFor,
      ensureServerConnected: actions.ensureServerConnected,
      loadConsumerGroupLag: actions.loadConsumerGroupLag,
      loadConsumerGroupLagFor: actions.loadConsumerGroupLagFor,
      openManualAvroSchema: actions.openManualAvroSchema,
      openTopicCreateForm: actions.openTopicCreateForm,
      openTopicInWorkspace: actions.openTopicInWorkspace,
      openTopicTab: actions.openTopicTab,
      refreshActiveWorkspaceView: actions.refreshActiveWorkspaceView,
      refreshCurrentView: actions.refreshCurrentView,
      refreshGroupsForServer: actions.refreshGroupsForServer,
      resetConsumerGroupOffsetsFor: actions.resetConsumerGroupOffsetsFor,
      refreshSplitPaneView: actions.refreshSplitPaneView,
      requestTopicAction: actions.requestTopicAction,
      selectTopicInWorkspace: actions.selectTopicInWorkspace,
      setActiveWorkspacePane: state.setActiveWorkspacePane,
      setSelectedGroupByServer: state.setSelectedGroupByServer,
      setSidebarCollapsed: state.setSidebarCollapsed,
      setView: actions.setView,
      showServerViewInActivePane: actions.showServerViewInActivePane,
      showSplitView: actions.showSplitView,
      startSplitPaneDrag: actions.startSplitPaneDrag,
      startTopicDrag: actions.startTopicDrag,
      toggleAllTopicRows: actions.toggleAllTopicRows,
      toggleFavoriteTopic: actions.toggleFavoriteTopic,
      toggleTopicRow: actions.toggleTopicRow
    }
  };
}
