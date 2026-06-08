import { useSidebarInteractionStore } from "../stores/ui/sidebarInteractionStore";

export type {
  DropPosition,
  ServerContextMenuState,
  TopicContextMenuState
} from "../stores/ui/sidebarInteractionStore";

export function useSidebarInteractionState() {
  const serverContextMenu = useSidebarInteractionStore((state) => state.serverContextMenu);
  const setServerContextMenu = useSidebarInteractionStore((state) => state.setServerContextMenu);
  const topicContextMenu = useSidebarInteractionStore((state) => state.topicContextMenu);
  const setTopicContextMenu = useSidebarInteractionStore((state) => state.setTopicContextMenu);
  const isTopicSortMenuOpen = useSidebarInteractionStore((state) => state.isTopicSortMenuOpen);
  const setIsTopicSortMenuOpen = useSidebarInteractionStore((state) => state.setIsTopicSortMenuOpen);
  const pendingTopicAction = useSidebarInteractionStore((state) => state.pendingTopicAction);
  const setPendingTopicAction = useSidebarInteractionStore((state) => state.setPendingTopicAction);
  const topicActionConfirmText = useSidebarInteractionStore((state) => state.topicActionConfirmText);
  const setTopicActionConfirmText = useSidebarInteractionStore((state) => state.setTopicActionConfirmText);
  const draggingServerId = useSidebarInteractionStore((state) => state.draggingServerId);
  const setDraggingServerId = useSidebarInteractionStore((state) => state.setDraggingServerId);
  const serverDropTarget = useSidebarInteractionStore((state) => state.serverDropTarget);
  const setServerDropTarget = useSidebarInteractionStore((state) => state.setServerDropTarget);
  const draggingFavoriteTopic = useSidebarInteractionStore((state) => state.draggingFavoriteTopic);
  const setDraggingFavoriteTopic = useSidebarInteractionStore((state) => state.setDraggingFavoriteTopic);
  const favoriteDropTarget = useSidebarInteractionStore((state) => state.favoriteDropTarget);
  const setFavoriteDropTarget = useSidebarInteractionStore((state) => state.setFavoriteDropTarget);
  const closeServerContextMenu = useSidebarInteractionStore((state) => state.closeServerContextMenu);
  const closeTopicContextMenu = useSidebarInteractionStore((state) => state.closeTopicContextMenu);

  return {
    serverContextMenu,
    setServerContextMenu,
    topicContextMenu,
    setTopicContextMenu,
    isTopicSortMenuOpen,
    setIsTopicSortMenuOpen,
    pendingTopicAction,
    setPendingTopicAction,
    topicActionConfirmText,
    setTopicActionConfirmText,
    draggingServerId,
    setDraggingServerId,
    serverDropTarget,
    setServerDropTarget,
    draggingFavoriteTopic,
    setDraggingFavoriteTopic,
    favoriteDropTarget,
    setFavoriteDropTarget,
    closeServerContextMenu,
    closeTopicContextMenu
  };
}
