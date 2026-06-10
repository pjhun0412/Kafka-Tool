import { useServerAppActions } from "..";

type ServerAppActionsParams = Parameters<typeof useServerAppActions>[0];

export function useWorkspaceControllerServer(params: ServerAppActionsParams) {
  const { lifecycleActions, sidebarDragActions } = useServerAppActions(params);
  const {
    saveServer,
    deleteServer,
    connectServer,
    openCluster,
    ensureServerConnected,
    disconnectServer,
    closeClusterTab
  } = lifecycleActions;
  const {
    handleServerDrop,
    handleServerDragEnd,
    handleFavoriteDrop,
    handleFavoriteDragEnd
  } = sidebarDragActions;

  return {
    saveServer,
    deleteServer,
    connectServer,
    openCluster,
    ensureServerConnected,
    disconnectServer,
    closeClusterTab,
    handleServerDrop,
    handleServerDragEnd,
    handleFavoriteDrop,
    handleFavoriteDragEnd
  };
}
