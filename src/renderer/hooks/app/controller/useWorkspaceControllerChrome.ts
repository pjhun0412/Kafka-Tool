import { useWorkspaceChromeCompositions } from "../layout/useWorkspaceChromeCompositions";
import { createOverlayChromeComposition } from "./chrome/overlayChromeComposition";
import { createSidebarChromeComposition } from "./chrome/sidebarChromeComposition";
import type { WorkspaceControllerChromeParams } from "./workspaceControllerChromeTypes";

export function useWorkspaceControllerChrome(params: WorkspaceControllerChromeParams) {
  return useWorkspaceChromeCompositions({
    sidebar: createSidebarChromeComposition(params),
    overlay: createOverlayChromeComposition(params)
  });
}
