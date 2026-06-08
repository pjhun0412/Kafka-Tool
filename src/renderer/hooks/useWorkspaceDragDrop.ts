import type React from "react";
import type { DragPayload } from "../uiTypes";
import { parseWorkspaceDragPayload, workspaceDragPayloadType } from "../workspaceState";

type WorkspaceDropSide = "left" | "right";
type TopicDragPayload = Extract<DragPayload, { type: "topic" }>;
type PrimaryTopicDragPayload = TopicDragPayload & { source: "primary" };
type SplitTopicDragPayload = TopicDragPayload & { source: "split" };

type UseWorkspaceDragDropOptions = {
  activeDragPayload: DragPayload | null;
  setActiveDragPayload: (payload: DragPayload | null) => void;
  setSplitDropSide: (side: WorkspaceDropSide | null) => void;
  onCloseSplitPane: () => Promise<void>;
  onOpenSplitFromPrimary: (payload: PrimaryTopicDragPayload) => Promise<void>;
  onMoveSplitToPrimary: (payload: SplitTopicDragPayload) => Promise<void>;
};

function getDropSide(event: React.DragEvent<HTMLElement>): WorkspaceDropSide {
  const rect = event.currentTarget.getBoundingClientRect();
  return event.clientX < rect.left + rect.width / 2 ? "left" : "right";
}

function isPrimaryTopicPayload(payload: DragPayload): payload is PrimaryTopicDragPayload {
  return payload.type === "topic" && payload.source === "primary";
}

function isSplitTopicPayload(payload: DragPayload): payload is SplitTopicDragPayload {
  return payload.type === "topic" && payload.source === "split";
}

export function useWorkspaceDragDrop({
  activeDragPayload,
  setActiveDragPayload,
  setSplitDropSide,
  onCloseSplitPane,
  onOpenSplitFromPrimary,
  onMoveSplitToPrimary
}: UseWorkspaceDragDropOptions) {
  function readDragPayload(event: React.DragEvent): DragPayload | null {
    return parseWorkspaceDragPayload(event.dataTransfer.getData(workspaceDragPayloadType)) ?? activeDragPayload;
  }

  function handleWorkspaceDragOver(event: React.DragEvent<HTMLElement>) {
    const payload = activeDragPayload ?? readDragPayload(event);
    if (!payload) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setSplitDropSide(getDropSide(event));
  }

  async function handleWorkspaceDrop(event: React.DragEvent<HTMLElement>) {
    const payload = activeDragPayload ?? readDragPayload(event);
    if (!payload) return;
    event.preventDefault();
    const side = getDropSide(event);
    setSplitDropSide(null);
    setActiveDragPayload(null);
    if (payload.type === "split-pane" && side === "left") {
      await onCloseSplitPane();
      return;
    }
    if (side === "right" && isPrimaryTopicPayload(payload)) {
      await onOpenSplitFromPrimary(payload);
      return;
    }
    if (side === "left" && isSplitTopicPayload(payload)) {
      await onMoveSplitToPrimary(payload);
    }
  }

  return {
    handleWorkspaceDragOver,
    handleWorkspaceDrop
  };
}
