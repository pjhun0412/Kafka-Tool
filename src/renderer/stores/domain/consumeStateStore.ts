import { create } from "zustand";
import type { ConsumeStatesByServer } from "../../workspaceState";

type SetValue<T> = T | ((current: T) => T);

type ConsumeStateStore = {
  consumeStatesByServer: ConsumeStatesByServer;
  splitConsumeStatesByServer: ConsumeStatesByServer;
  setConsumeStatesByServer: (value: SetValue<ConsumeStatesByServer>) => void;
  setSplitConsumeStatesByServer: (value: SetValue<ConsumeStatesByServer>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useConsumeStateZustandStore = create<ConsumeStateStore>((set) => ({
  consumeStatesByServer: {},
  splitConsumeStatesByServer: {},
  setConsumeStatesByServer: (consumeStatesByServer) => set((current) => ({
    consumeStatesByServer: resolveValue(consumeStatesByServer, current.consumeStatesByServer)
  })),
  setSplitConsumeStatesByServer: (splitConsumeStatesByServer) => set((current) => ({
    splitConsumeStatesByServer: resolveValue(splitConsumeStatesByServer, current.splitConsumeStatesByServer)
  }))
}));
