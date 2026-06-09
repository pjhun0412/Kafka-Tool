import { create } from "zustand";
import type { TopicAction } from "../../uiTypes";

type SetValue<T> = T | ((current: T) => T);
export type ServerContextMenuState = { serverId: string; x: number; y: number } | null;
export type TopicContextMenuState = { topic: string; x: number; y: number } | null;
export type DropPosition = "before" | "after";
export type ServerDropTarget = { id: string; position: DropPosition } | null;
export type FavoriteDropTarget = { topic: string; position: DropPosition } | null;

type SidebarInteractionStore = {
  serverContextMenu: ServerContextMenuState;
  topicContextMenu: TopicContextMenuState;
  isTopicSortMenuOpen: boolean;
  pendingTopicAction: TopicAction;
  topicActionConfirmText: string;
  draggingServerId: string;
  serverDropTarget: ServerDropTarget;
  draggingFavoriteTopic: string;
  favoriteDropTarget: FavoriteDropTarget;
  setServerContextMenu: (value: SetValue<ServerContextMenuState>) => void;
  setTopicContextMenu: (value: SetValue<TopicContextMenuState>) => void;
  setIsTopicSortMenuOpen: (value: SetValue<boolean>) => void;
  setPendingTopicAction: (value: SetValue<TopicAction>) => void;
  setTopicActionConfirmText: (value: SetValue<string>) => void;
  setDraggingServerId: (value: SetValue<string>) => void;
  setServerDropTarget: (value: SetValue<ServerDropTarget>) => void;
  setDraggingFavoriteTopic: (value: SetValue<string>) => void;
  setFavoriteDropTarget: (value: SetValue<FavoriteDropTarget>) => void;
  closeServerContextMenu: () => void;
  closeTopicContextMenu: () => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useSidebarInteractionStore = create<SidebarInteractionStore>((set) => ({
  serverContextMenu: null,
  topicContextMenu: null,
  isTopicSortMenuOpen: false,
  pendingTopicAction: null,
  topicActionConfirmText: "",
  draggingServerId: "",
  serverDropTarget: null,
  draggingFavoriteTopic: "",
  favoriteDropTarget: null,
  setServerContextMenu: (serverContextMenu) => set((current) => ({
    serverContextMenu: resolveValue(serverContextMenu, current.serverContextMenu)
  })),
  setTopicContextMenu: (topicContextMenu) => set((current) => ({
    topicContextMenu: resolveValue(topicContextMenu, current.topicContextMenu)
  })),
  setIsTopicSortMenuOpen: (isTopicSortMenuOpen) => set((current) => ({
    isTopicSortMenuOpen: resolveValue(isTopicSortMenuOpen, current.isTopicSortMenuOpen)
  })),
  setPendingTopicAction: (pendingTopicAction) => set((current) => ({
    pendingTopicAction: resolveValue(pendingTopicAction, current.pendingTopicAction)
  })),
  setTopicActionConfirmText: (topicActionConfirmText) => set((current) => ({
    topicActionConfirmText: resolveValue(topicActionConfirmText, current.topicActionConfirmText)
  })),
  setDraggingServerId: (draggingServerId) => set((current) => ({
    draggingServerId: resolveValue(draggingServerId, current.draggingServerId)
  })),
  setServerDropTarget: (serverDropTarget) => set((current) => ({
    serverDropTarget: resolveValue(serverDropTarget, current.serverDropTarget)
  })),
  setDraggingFavoriteTopic: (draggingFavoriteTopic) => set((current) => ({
    draggingFavoriteTopic: resolveValue(draggingFavoriteTopic, current.draggingFavoriteTopic)
  })),
  setFavoriteDropTarget: (favoriteDropTarget) => set((current) => ({
    favoriteDropTarget: resolveValue(favoriteDropTarget, current.favoriteDropTarget)
  })),
  closeServerContextMenu: () => set({ serverContextMenu: null }),
  closeTopicContextMenu: () => set({ topicContextMenu: null })
}));
