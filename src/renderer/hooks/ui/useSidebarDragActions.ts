import type { Dispatch, SetStateAction } from "react";
import type { DragPayload } from "../../uiTypes";

type ServerDropTarget = { id: string; position: "before" | "after" } | null;
type FavoriteDropTarget = { topic: string; position: "before" | "after" } | null;

type SidebarDragActionsParams = {
  reorderServer: (draggedId: string, targetId: string, position: "before" | "after") => Promise<void>;
  reorderFavoriteTopic: (draggedTopic: string, targetTopic: string, position: "before" | "after") => void;
  setDraggingServerId: Dispatch<SetStateAction<string>>;
  setServerDropTarget: Dispatch<SetStateAction<ServerDropTarget>>;
  setActiveDragPayload: Dispatch<SetStateAction<DragPayload | null>>;
  setSplitDropSide: Dispatch<SetStateAction<"left" | "right" | null>>;
  setDraggingFavoriteTopic: Dispatch<SetStateAction<string>>;
  setFavoriteDropTarget: Dispatch<SetStateAction<FavoriteDropTarget>>;
};

export function useSidebarDragActions({
  reorderServer,
  reorderFavoriteTopic,
  setDraggingServerId,
  setServerDropTarget,
  setActiveDragPayload,
  setSplitDropSide,
  setDraggingFavoriteTopic,
  setFavoriteDropTarget
}: SidebarDragActionsParams) {
  const handleServerDrop = (draggedId: string, serverId: string, position: "before" | "after") => {
    setDraggingServerId("");
    setServerDropTarget(null);
    void reorderServer(draggedId, serverId, position);
  };

  const handleServerDragEnd = () => {
    setDraggingServerId("");
    setServerDropTarget(null);
    setActiveDragPayload(null);
    setSplitDropSide(null);
  };

  const handleFavoriteDrop = (draggedTopic: string, targetTopic: string, position: "before" | "after") => {
    reorderFavoriteTopic(draggedTopic, targetTopic, position);
    setDraggingFavoriteTopic("");
    setFavoriteDropTarget(null);
  };

  const handleFavoriteDragEnd = () => {
    setDraggingFavoriteTopic("");
    setFavoriteDropTarget(null);
  };

  return {
    handleServerDrop,
    handleServerDragEnd,
    handleFavoriteDrop,
    handleFavoriteDragEnd
  };
}
