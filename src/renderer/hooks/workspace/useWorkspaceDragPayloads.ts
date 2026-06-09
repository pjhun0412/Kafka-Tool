import type React from "react";
import type { DragPayload } from "../../uiTypes";
import { writeWorkspaceDragPayload } from "../../workspaceState";

export function useWorkspaceDragPayloads(params: {
  setActiveDragPayload: React.Dispatch<React.SetStateAction<DragPayload | null>>;
  setSplitDropSide: React.Dispatch<React.SetStateAction<"left" | "right" | null>>;
}) {
  const startTopicDrag = (event: React.DragEvent, serverId: string, topic: string, source: "primary" | "split") => {
    const payload: DragPayload = { type: "topic", serverId, topic, source };
    params.setActiveDragPayload(payload);
    writeWorkspaceDragPayload(event.dataTransfer, payload);
  };

  const startSplitPaneDrag = (event: React.DragEvent) => {
    const payload: DragPayload = { type: "split-pane" };
    params.setActiveDragPayload(payload);
    writeWorkspaceDragPayload(event.dataTransfer, payload);
  };

  const clearDragPayload = () => {
    params.setActiveDragPayload(null);
    params.setSplitDropSide(null);
  };

  return { startTopicDrag, startSplitPaneDrag, clearDragPayload };
}
