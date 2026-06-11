import { useSplitWorkspaceActions } from "../workspace/useSplitWorkspaceActions";
import { useWorkspaceDragComposition } from "../workspace/useWorkspaceDragComposition";

type SplitWorkspaceActionsParams = Parameters<typeof useSplitWorkspaceActions>[0];
type WorkspaceDragCompositionParams = Parameters<typeof useWorkspaceDragComposition>[0];

export type WorkspaceControllerSplitParams = {
  state: Pick<
    SplitWorkspaceActionsParams["view"] &
      SplitWorkspaceActionsParams["pane"] &
      WorkspaceDragCompositionParams["payloads"] &
      WorkspaceDragCompositionParams["drop"],
    | "activeDragPayload"
    | "brokersByServer"
    | "clearConsumeStateForPane"
    | "clearConsumeStatesForPane"
    | "getCachedTopicDetail"
    | "getTopicViewFor"
    | "groupsByServer"
    | "isTopicStreaming"
    | "moveConsumeStateBetweenPanes"
    | "openedTopicTabs"
    | "previewTopic"
    | "retargetLiveTopic"
    | "selectedServerId"
    | "selectedTopic"
    | "setActiveDragPayload"
    | "setActiveWorkspacePane"
    | "setConsumeStatesByServer"
    | "setOpenedTopicTabs"
    | "setOpenedTopicTabsByServer"
    | "setPreviewTopicByServer"
    | "setSelectedServerId"
    | "setSelectedTopic"
    | "setSelectedTopicByServer"
    | "setSplitConsumeStatesByServer"
    | "setSplitDropSide"
    | "setSplitPane"
    | "setTopicDetail"
    | "setTopicDetailForServer"
    | "setTopicViewByServer"
    | "setViewByServer"
    | "splitConsumeStatesByServer"
    | "splitPane"
    | "topicDetailByServer"
    | "topicsByServer"
  >;
  navigation: Pick<SplitWorkspaceActionsParams["view"], "setTopicViewFor" | "loadSplitTopicDetailSilent"> &
    Pick<SplitWorkspaceActionsParams["pane"], "selectPrimaryTopic">;
  refreshActions: Pick<
    SplitWorkspaceActionsParams["view"],
    "refreshBrokersForServer" | "refreshTopicsForServer" | "refreshGroupsForServer"
  >;
  stopConsume: SplitWorkspaceActionsParams["pane"]["stopConsume"];
};

export function useWorkspaceControllerSplit({
  state,
  navigation,
  refreshActions,
  stopConsume
}: WorkspaceControllerSplitParams) {
  const {
    viewActions: splitViewActions,
    paneActions: splitPaneActions
  } = useSplitWorkspaceActions({
    view: {
      splitPane: state.splitPane,
      setSplitPane: state.setSplitPane,
      brokersByServer: state.brokersByServer,
      topicsByServer: state.topicsByServer,
      groupsByServer: state.groupsByServer,
      setTopicViewFor: navigation.setTopicViewFor,
      loadSplitTopicDetailSilent: navigation.loadSplitTopicDetailSilent,
      ...refreshActions
    },
    pane: {
      kafkaApi: window.kafkaApi,
      selectedServerId: state.selectedServerId,
      selectedTopic: state.selectedTopic,
      openedTopicTabs: state.openedTopicTabs,
      previewTopic: state.previewTopic,
      splitPane: state.splitPane,
      splitConsumeStatesByServer: state.splitConsumeStatesByServer,
      topicDetailByServer: state.topicDetailByServer,
      getTopicViewFor: state.getTopicViewFor,
      getCachedTopicDetail: state.getCachedTopicDetail,
      setTopicDetailForServer: state.setTopicDetailForServer,
      isTopicStreaming: state.isTopicStreaming,
      stopConsume,
      moveConsumeStateBetweenPanes: state.moveConsumeStateBetweenPanes,
      retargetLiveTopic: state.retargetLiveTopic,
      clearConsumeStatesForPane: state.clearConsumeStatesForPane,
      clearConsumeStateForPane: state.clearConsumeStateForPane,
      loadSplitTopicDetailSilent: navigation.loadSplitTopicDetailSilent,
      selectPrimaryTopic: navigation.selectPrimaryTopic,
      setOpenedTopicTabs: state.setOpenedTopicTabs,
      setSelectedTopic: state.setSelectedTopic,
      setTopicDetail: state.setTopicDetail,
      setSplitPane: state.setSplitPane,
      setActiveWorkspacePane: state.setActiveWorkspacePane,
      setSelectedServerId: state.setSelectedServerId,
      setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
      setPreviewTopicByServer: state.setPreviewTopicByServer,
      setSelectedTopicByServer: state.setSelectedTopicByServer,
      setViewByServer: state.setViewByServer,
      setTopicViewByServer: state.setTopicViewByServer,
      setConsumeStatesByServer: state.setConsumeStatesByServer,
      setSplitConsumeStatesByServer: state.setSplitConsumeStatesByServer
    }
  });
  const { showSplitView } = splitViewActions;
  const {
    openSplitForTopic,
    moveSplitTopicToPrimary,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary
  } = splitPaneActions;
  const { payloadActions, dropActions } = useWorkspaceDragComposition({
    payloads: {
      setActiveDragPayload: state.setActiveDragPayload,
      setSplitDropSide: state.setSplitDropSide
    },
    drop: {
      activeDragPayload: state.activeDragPayload,
      setActiveDragPayload: state.setActiveDragPayload,
      setSplitDropSide: state.setSplitDropSide,
      onCloseSplitPane: closeSplitPane,
      onOpenSplitFromPrimary: async (payload) => {
        await openSplitForTopic(payload.serverId, payload.topic);
      },
      onMoveSplitToPrimary: async (payload) => {
        await moveSplitTopicToPrimary(payload.topic);
      }
    }
  });

  return {
    showSplitView,
    openSplitForTopic,
    moveSplitTopicToPrimary,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary,
    startTopicDrag: payloadActions.startTopicDrag,
    startSplitPaneDrag: payloadActions.startSplitPaneDrag,
    clearDragPayload: payloadActions.clearDragPayload,
    handleWorkspaceDragOver: dropActions.handleWorkspaceDragOver,
    handleWorkspaceDrop: dropActions.handleWorkspaceDrop
  };
}
