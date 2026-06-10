import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerSearchParams } from "../useWorkspaceControllerSearch";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

export function createWorkspaceSearchParams(state: ControllerState): WorkspaceControllerSearchParams {
  return {
    appSearch: {
      servers: state.servers,
      selectedServerId: state.selectedServerId,
      contextServerId: state.serverContextMenu?.serverId,
      topicsByServer: state.topicsByServer,
      openedTopicTabsByServer: state.openedTopicTabsByServer,
      manualAvroSchemasByServer: state.manualAvroSchemasByServer,
      groupsByServer: state.groupsByServer,
      connectedServerIds: state.connectedServerIds,
      favoriteTopicsByServer: state.favoriteTopicsByServer
    },
    favorites: {
      selectedServerId: state.selectedServerId,
      setFavoriteTopicsByServer: state.setFavoriteTopicsByServer
    },
    rowSelection: {
      setToast: state.setToast
    },
    selectedTopicByServer: state.selectedTopicByServer,
    selectedServerId: state.selectedServerId
  };
}
