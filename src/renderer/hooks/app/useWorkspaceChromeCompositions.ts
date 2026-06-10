import {
  useWorkspaceOverlayProps,
  useWorkspaceSidebarProps
} from "../callbacks";

type SidebarPropsParams = Parameters<typeof useWorkspaceSidebarProps>[0];
type OverlayPropsParams = Parameters<typeof useWorkspaceOverlayProps>[0];

type WorkspaceChromeCompositionsParams = {
  sidebar: SidebarPropsParams;
  overlay: OverlayPropsParams;
};

export function useWorkspaceChromeCompositions({
  sidebar,
  overlay
}: WorkspaceChromeCompositionsParams) {
  return {
    sidebarProps: useWorkspaceSidebarProps(sidebar),
    overlayProps: useWorkspaceOverlayProps(overlay)
  };
}
