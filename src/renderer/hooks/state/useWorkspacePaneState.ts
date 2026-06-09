import type { PointerEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWorkspacePaneStore } from "../../stores/ui/workspacePaneStore";

export type { SplitDropSide } from "../../uiTypes";

export function useWorkspacePaneState(selectedServerId: string) {
  const {
    splitPaneByServer,
    setSplitPane,
    setSplitPaneForServer,
    splitDropSide,
    setSplitDropSide,
    splitPrimaryPercent,
    setSplitPrimaryPercent,
    activeWorkspacePane,
    setActiveWorkspacePane,
    activeDragPayload,
    setActiveDragPayload
  } = useWorkspacePaneStore(useShallow((state) => ({
    splitPaneByServer: state.splitPaneByServer,
    setSplitPane: state.setSplitPane,
    setSplitPaneForServer: state.setSplitPaneForServer,
    splitDropSide: state.splitDropSide,
    setSplitDropSide: state.setSplitDropSide,
    splitPrimaryPercent: state.splitPrimaryPercent,
    setSplitPrimaryPercent: state.setSplitPrimaryPercent,
    activeWorkspacePane: state.activeWorkspacePane,
    setActiveWorkspacePane: state.setActiveWorkspacePane,
    activeDragPayload: state.activeDragPayload,
    setActiveDragPayload: state.setActiveDragPayload
  })));
  const splitPane = selectedServerId ? splitPaneByServer[selectedServerId] ?? null : null;

  function setSelectedServerSplitPane(value: Parameters<typeof setSplitPane>[0]) {
    if (!selectedServerId) {
      setSplitPane(value);
      return;
    }
    setSplitPaneForServer(selectedServerId, value);
  }

  function startWorkspaceSplitResize(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const container = event.currentTarget.closest(".workspace") as HTMLElement | null;
    const rect = container?.getBoundingClientRect();
    if (!rect) return;
    const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
      const percent = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      setSplitPrimaryPercent(Math.min(72, Math.max(28, percent)));
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  return {
    splitPane,
    setSplitPane: setSelectedServerSplitPane,
    splitPaneByServer,
    setSplitPaneForServer,
    splitDropSide,
    setSplitDropSide,
    splitPrimaryPercent,
    setSplitPrimaryPercent,
    activeWorkspacePane,
    setActiveWorkspacePane,
    activeDragPayload,
    setActiveDragPayload,
    startWorkspaceSplitResize
  };
}
