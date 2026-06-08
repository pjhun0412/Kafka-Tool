import type { PointerEvent } from "react";
import { useWorkspacePaneStore } from "../stores/ui/workspacePaneStore";

export type { SplitDropSide } from "../uiTypes";

export function useWorkspacePaneState() {
  const splitPane = useWorkspacePaneStore((state) => state.splitPane);
  const setSplitPane = useWorkspacePaneStore((state) => state.setSplitPane);
  const splitDropSide = useWorkspacePaneStore((state) => state.splitDropSide);
  const setSplitDropSide = useWorkspacePaneStore((state) => state.setSplitDropSide);
  const splitPrimaryPercent = useWorkspacePaneStore((state) => state.splitPrimaryPercent);
  const setSplitPrimaryPercent = useWorkspacePaneStore((state) => state.setSplitPrimaryPercent);
  const activeWorkspacePane = useWorkspacePaneStore((state) => state.activeWorkspacePane);
  const setActiveWorkspacePane = useWorkspacePaneStore((state) => state.setActiveWorkspacePane);
  const activeDragPayload = useWorkspacePaneStore((state) => state.activeDragPayload);
  const setActiveDragPayload = useWorkspacePaneStore((state) => state.setActiveDragPayload);

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
    setSplitPane,
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
