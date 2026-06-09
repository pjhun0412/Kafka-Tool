import { useShallow } from "zustand/react/shallow";
import { useSidebarInteractionStore } from "../../stores/ui/sidebarInteractionStore";

export type {
  DropPosition,
  ServerContextMenuState,
  TopicContextMenuState
} from "../../stores/ui/sidebarInteractionStore";

export function useSidebarInteractionState() {
  const {
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
  } = useSidebarInteractionStore(useShallow((state) => ({
    serverContextMenu: state.serverContextMenu,
    setServerContextMenu: state.setServerContextMenu,
    topicContextMenu: state.topicContextMenu,
    setTopicContextMenu: state.setTopicContextMenu,
    isTopicSortMenuOpen: state.isTopicSortMenuOpen,
    setIsTopicSortMenuOpen: state.setIsTopicSortMenuOpen,
    pendingTopicAction: state.pendingTopicAction,
    setPendingTopicAction: state.setPendingTopicAction,
    topicActionConfirmText: state.topicActionConfirmText,
    setTopicActionConfirmText: state.setTopicActionConfirmText,
    draggingServerId: state.draggingServerId,
    setDraggingServerId: state.setDraggingServerId,
    serverDropTarget: state.serverDropTarget,
    setServerDropTarget: state.setServerDropTarget,
    draggingFavoriteTopic: state.draggingFavoriteTopic,
    setDraggingFavoriteTopic: state.setDraggingFavoriteTopic,
    favoriteDropTarget: state.favoriteDropTarget,
    setFavoriteDropTarget: state.setFavoriteDropTarget,
    closeServerContextMenu: state.closeServerContextMenu,
    closeTopicContextMenu: state.closeTopicContextMenu
  })));

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
