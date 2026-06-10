import type { WorkspaceControllerLayoutParams } from "../useWorkspaceControllerLayout";
import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

export function createWorkspaceLayoutParams(params: {
  state: ControllerState;
  visibleSplitPane: WorkspaceControllerLayoutParams["visibleSplitPane"];
  onWorkspaceDragOver: WorkspaceControllerLayoutParams["onWorkspaceDragOver"];
  onWorkspaceDrop: WorkspaceControllerLayoutParams["onWorkspaceDrop"];
  sidebarProps: WorkspaceControllerLayoutParams["sidebarProps"];
  primaryPaneProps: WorkspaceControllerLayoutParams["primaryPaneProps"];
  splitPaneProps: WorkspaceControllerLayoutParams["splitPaneProps"];
  overlayProps: WorkspaceControllerLayoutParams["overlayProps"];
}): WorkspaceControllerLayoutParams {
  return params;
}
