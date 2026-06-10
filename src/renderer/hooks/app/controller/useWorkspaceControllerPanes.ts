import { useWorkspacePaneCompositions } from "../workspace/useWorkspacePaneCompositions";
import { createPrimaryPaneComposition } from "./panes/primaryPaneComposition";
import { createSplitPaneComposition } from "./panes/splitPaneComposition";
import type { WorkspaceControllerPanesParams } from "./workspaceControllerPaneTypes";

export function useWorkspaceControllerPanes(params: WorkspaceControllerPanesParams) {
  return useWorkspacePaneCompositions({
    ...createPrimaryPaneComposition(params),
    ...createSplitPaneComposition(params)
  });
}
