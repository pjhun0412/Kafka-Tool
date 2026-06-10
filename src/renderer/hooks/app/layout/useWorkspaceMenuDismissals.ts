import { useDismissOnWindowInteraction } from "../../ui";

type WorkspaceMenuDismissalsParams = {
  serverContextMenuOpen: boolean;
  topicContextMenuOpen: boolean;
  topicSortMenuOpen: boolean;
  closeServerContextMenu: () => void;
  closeTopicContextMenu: () => void;
  closeTopicSortMenu: () => void;
};

export function useWorkspaceMenuDismissals(params: WorkspaceMenuDismissalsParams) {
  useDismissOnWindowInteraction(params.serverContextMenuOpen, params.closeServerContextMenu);
  useDismissOnWindowInteraction(params.topicContextMenuOpen, params.closeTopicContextMenu);
  useDismissOnWindowInteraction(params.topicSortMenuOpen, params.closeTopicSortMenu);
}
