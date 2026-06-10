import { useWorkspaceLayoutComposition } from "../layout/useWorkspaceLayoutComposition";

type LayoutPropsParams = Parameters<typeof useWorkspaceLayoutComposition>[0];

type ControllerLayoutState = Pick<
  LayoutPropsParams,
  "sidebarCollapsed" | "sidebarWidth" | "splitPrimaryPercent" | "splitDropSide"
> & {
  startSidebarResize: LayoutPropsParams["onSidebarResize"];
  startWorkspaceSplitResize: LayoutPropsParams["onWorkspaceSplitResize"];
  setSplitDropSide: (value: LayoutPropsParams["splitDropSide"]) => void;
};

export type WorkspaceControllerLayoutParams = {
  state: ControllerLayoutState;
  visibleSplitPane: unknown;
  sidebarProps: LayoutPropsParams["sidebarProps"];
  primaryPaneProps: LayoutPropsParams["primaryPaneProps"];
  splitPaneProps: LayoutPropsParams["splitPaneProps"];
  overlayProps: LayoutPropsParams["overlayProps"];
  onWorkspaceDragOver: LayoutPropsParams["onWorkspaceDragOver"];
  onWorkspaceDrop: LayoutPropsParams["onWorkspaceDrop"];
};

export function useWorkspaceControllerLayout({
  state,
  visibleSplitPane,
  sidebarProps,
  primaryPaneProps,
  splitPaneProps,
  overlayProps,
  onWorkspaceDragOver,
  onWorkspaceDrop
}: WorkspaceControllerLayoutParams) {
  return useWorkspaceLayoutComposition({
    sidebarCollapsed: state.sidebarCollapsed,
    sidebarWidth: state.sidebarWidth,
    splitMode: Boolean(visibleSplitPane),
    splitPrimaryPercent: state.splitPrimaryPercent,
    splitDropSide: state.splitDropSide,
    onSidebarResize: state.startSidebarResize,
    onWorkspaceSplitResize: state.startWorkspaceSplitResize,
    onWorkspaceDragOver,
    onWorkspaceDragLeave: () => state.setSplitDropSide(null),
    onWorkspaceDrop,
    sidebarProps,
    primaryPaneProps,
    splitPaneProps,
    overlayProps
  });
}
