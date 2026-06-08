import type React from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ServerProfile } from "../../../shared/types";

type ServerContextMenuState = {
  serverId: string;
  x: number;
  y: number;
} | null;

type TopicContextMenuState = {
  topic: string;
  x: number;
  y: number;
} | null;

type SidebarContextMenuActionsParams = {
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setServerContextMenu: Dispatch<SetStateAction<ServerContextMenuState>>;
  setTopicContextMenu: Dispatch<SetStateAction<TopicContextMenuState>>;
};

export function useSidebarContextMenus({
  setSelectedServerId,
  setServerContextMenu,
  setTopicContextMenu
}: SidebarContextMenuActionsParams) {
  function openServerContextMenu(event: React.MouseEvent, server: ServerProfile) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedServerId(server.id);
    setServerContextMenu({
      serverId: server.id,
      x: Math.min(event.clientX, window.innerWidth - 170),
      y: Math.min(event.clientY, window.innerHeight - 140)
    });
  }

  function openTopicContextMenu(event: React.MouseEvent, topic: string) {
    event.preventDefault();
    event.stopPropagation();
    setTopicContextMenu({
      topic,
      x: Math.min(event.clientX, window.innerWidth - 190),
      y: Math.min(event.clientY, window.innerHeight - 190)
    });
  }

  return {
    openServerContextMenu,
    openTopicContextMenu
  };
}
