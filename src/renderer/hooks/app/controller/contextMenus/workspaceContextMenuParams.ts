import type { WorkspaceContextMenuActionsParams } from "../../actions/useWorkspaceContextMenuActions";
import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

export function createWorkspaceContextMenuParams(state: ControllerState): WorkspaceContextMenuActionsParams {
  return {
    setSelectedServerId: state.setSelectedServerId,
    setServerContextMenu: state.setServerContextMenu,
    setTopicContextMenu: state.setTopicContextMenu
  };
}
