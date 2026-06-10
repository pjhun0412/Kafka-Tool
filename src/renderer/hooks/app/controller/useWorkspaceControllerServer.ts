import { useServerAppActions } from "../actions/useServerAppActions";

type ServerAppActionsParams = Parameters<typeof useServerAppActions>[0];
type LifecycleParams = ServerAppActionsParams["lifecycle"];
type SidebarDragParams = ServerAppActionsParams["sidebarDrag"];
type ControllerServerState = Omit<
  LifecycleParams,
  | "kafkaApi"
  | "runTask"
  | "stopConsume"
  | "refreshTopicsForServer"
  | "refreshBrokersForServer"
  | "refreshGroupsForServer"
  | "setOpenedTopicTabs"
  | "setSelectedTopic"
  | "setTopicDetail"
  | "setTopics"
  | "setGroups"
> &
  Omit<SidebarDragParams, "reorderFavoriteTopic">;

export type WorkspaceControllerServerParams = {
  state: ControllerServerState;
  resourceSetters: Pick<LifecycleParams, "setOpenedTopicTabs" | "setSelectedTopic" | "setTopicDetail" | "setTopics" | "setGroups">;
  refreshActions: Pick<LifecycleParams, "refreshTopicsForServer" | "refreshBrokersForServer" | "refreshGroupsForServer">;
  reorderFavoriteTopic: SidebarDragParams["reorderFavoriteTopic"];
  runTask: LifecycleParams["runTask"];
  stopConsume: LifecycleParams["stopConsume"];
};

export function useWorkspaceControllerServer({
  state,
  resourceSetters,
  refreshActions,
  reorderFavoriteTopic,
  runTask,
  stopConsume
}: WorkspaceControllerServerParams) {
  const { lifecycleActions, sidebarDragActions } = useServerAppActions({
    lifecycle: {
      kafkaApi: window.kafkaApi,
      servers: state.servers,
      connectedServerIds: state.connectedServerIds,
      openClusterIds: state.openClusterIds,
      selectedServerId: state.selectedServerId,
      streamingTopicsByServer: state.streamingTopicsByServer,
      runTask,
      stopConsume,
      ...refreshActions,
      setServers: state.setServers,
      setSelectedServerId: state.setSelectedServerId,
      setConnectedServerIds: state.setConnectedServerIds,
      setFailedServerIds: state.setFailedServerIds,
      setHealthFailuresByServer: state.setHealthFailuresByServer,
      setOpenClusterIds: state.setOpenClusterIds,
      ...resourceSetters,
      setBrokersByServer: state.setBrokersByServer,
      setConsumeStates: state.setConsumeStates,
      setSplitConsumeStatesByServer: state.setSplitConsumeStatesByServer,
      setViewByServer: state.setViewByServer,
      setTopicViewByServer: state.setTopicViewByServer,
      setStreamingTopicsByServer: state.setStreamingTopicsByServer,
      setConnectionError: state.setConnectionError,
      setToast: state.setToast,
      setStatus: state.setStatus
    },
    sidebarDrag: {
      reorderFavoriteTopic,
      setDraggingServerId: state.setDraggingServerId,
      setServerDropTarget: state.setServerDropTarget,
      setActiveDragPayload: state.setActiveDragPayload,
      setSplitDropSide: state.setSplitDropSide,
      setDraggingFavoriteTopic: state.setDraggingFavoriteTopic,
      setFavoriteDropTarget: state.setFavoriteDropTarget
    }
  });

  return {
    saveServer: lifecycleActions.saveServer,
    deleteServer: lifecycleActions.deleteServer,
    connectServer: lifecycleActions.connectServer,
    openCluster: lifecycleActions.openCluster,
    ensureServerConnected: lifecycleActions.ensureServerConnected,
    disconnectServer: lifecycleActions.disconnectServer,
    closeClusterTab: lifecycleActions.closeClusterTab,
    handleServerDrop: sidebarDragActions.handleServerDrop,
    handleServerDragEnd: sidebarDragActions.handleServerDragEnd,
    handleFavoriteDrop: sidebarDragActions.handleFavoriteDrop,
    handleFavoriteDragEnd: sidebarDragActions.handleFavoriteDragEnd
  };
}
