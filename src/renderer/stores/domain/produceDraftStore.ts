import { create } from "zustand";

export const emptyProduceDraft = {
  key: "",
  headers: "{}",
  value: "{\n  \"hello\": \"kafka\"\n}"
};

export type ProduceDraft = typeof emptyProduceDraft;

type ProduceDraftsByServer = Record<string, Record<string, ProduceDraft>>;

type ProduceDraftStore = {
  produceDraftsByServer: ProduceDraftsByServer;
  updateProduceDraftFor: (serverId: string, topic: string, patch: Partial<ProduceDraft>) => void;
  resetProduceDrafts: () => void;
};

export const useProduceDraftZustandStore = create<ProduceDraftStore>((set) => ({
  produceDraftsByServer: {},
  updateProduceDraftFor: (serverId, topic, patch) => {
    if (!serverId || !topic) return;
    set((current) => {
      const serverDrafts = current.produceDraftsByServer[serverId] ?? {};
      const existing = serverDrafts[topic] ?? emptyProduceDraft;
      return {
        produceDraftsByServer: {
          ...current.produceDraftsByServer,
          [serverId]: {
            ...serverDrafts,
            [topic]: { ...existing, ...patch }
          }
        }
      };
    });
  },
  resetProduceDrafts: () => set({ produceDraftsByServer: {} })
}));
