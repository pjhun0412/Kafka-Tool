import { useSidebarContextMenus } from "../../search";

type WorkspaceContextMenuActionsParams = Parameters<typeof useSidebarContextMenus>[0];

export type { WorkspaceContextMenuActionsParams };

export function useWorkspaceContextMenuActions(params: WorkspaceContextMenuActionsParams) {
  return useSidebarContextMenus(params);
}
