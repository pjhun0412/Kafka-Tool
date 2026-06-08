import { create } from "zustand";
import type { DragPayload, SplitDropSide, SplitPaneState, WorkspacePaneId } from "../../uiTypes";

type SetValue<T> = T | ((current: T) => T);

type WorkspacePaneStore = {
  splitPane: SplitPaneState | null;
  splitDropSide: SplitDropSide;
  splitPrimaryPercent: number;
  activeWorkspacePane: WorkspacePaneId;
  activeDragPayload: DragPayload | null;
  setSplitPane: (value: SetValue<SplitPaneState | null>) => void;
  setSplitDropSide: (value: SetValue<SplitDropSide>) => void;
  setSplitPrimaryPercent: (value: SetValue<number>) => void;
  setActiveWorkspacePane: (value: SetValue<WorkspacePaneId>) => void;
  setActiveDragPayload: (value: SetValue<DragPayload | null>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useWorkspacePaneStore = create<WorkspacePaneStore>((set) => ({
  splitPane: null,
  splitDropSide: null,
  splitPrimaryPercent: 50,
  activeWorkspacePane: "primary",
  activeDragPayload: null,
  setSplitPane: (splitPane) => set((current) => ({ splitPane: resolveValue(splitPane, current.splitPane) })),
  setSplitDropSide: (splitDropSide) => set((current) => ({ splitDropSide: resolveValue(splitDropSide, current.splitDropSide) })),
  setSplitPrimaryPercent: (splitPrimaryPercent) => set((current) => ({
    splitPrimaryPercent: resolveValue(splitPrimaryPercent, current.splitPrimaryPercent)
  })),
  setActiveWorkspacePane: (activeWorkspacePane) => set((current) => ({
    activeWorkspacePane: resolveValue(activeWorkspacePane, current.activeWorkspacePane)
  })),
  setActiveDragPayload: (activeDragPayload) => set((current) => ({
    activeDragPayload: resolveValue(activeDragPayload, current.activeDragPayload)
  }))
}));
