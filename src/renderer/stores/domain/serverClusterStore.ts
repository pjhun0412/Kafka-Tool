import { create } from "zustand";
import type { ServerProfile } from "../../../shared/types";

type SetValue<T> = T | ((current: T) => T);

type ServerClusterStore = {
  servers: ServerProfile[];
  connectedServerIds: string[];
  failedServerIds: string[];
  healthFailuresByServer: Record<string, number>;
  openClusterIds: string[];
  selectedServerId: string;
  setServers: (value: SetValue<ServerProfile[]>) => void;
  setConnectedServerIds: (value: SetValue<string[]>) => void;
  setFailedServerIds: (value: SetValue<string[]>) => void;
  setHealthFailuresByServer: (value: SetValue<Record<string, number>>) => void;
  setOpenClusterIds: (value: SetValue<string[]>) => void;
  setSelectedServerId: (value: SetValue<string>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useServerClusterStore = create<ServerClusterStore>((set) => ({
  servers: [],
  connectedServerIds: [],
  failedServerIds: [],
  healthFailuresByServer: {},
  openClusterIds: [],
  selectedServerId: "",
  setServers: (servers) => set((current) => ({ servers: resolveValue(servers, current.servers) })),
  setConnectedServerIds: (connectedServerIds) => set((current) => ({
    connectedServerIds: resolveValue(connectedServerIds, current.connectedServerIds)
  })),
  setFailedServerIds: (failedServerIds) => set((current) => ({
    failedServerIds: resolveValue(failedServerIds, current.failedServerIds)
  })),
  setHealthFailuresByServer: (healthFailuresByServer) => set((current) => ({
    healthFailuresByServer: resolveValue(healthFailuresByServer, current.healthFailuresByServer)
  })),
  setOpenClusterIds: (openClusterIds) => set((current) => ({
    openClusterIds: resolveValue(openClusterIds, current.openClusterIds)
  })),
  setSelectedServerId: (selectedServerId) => set((current) => ({
    selectedServerId: resolveValue(selectedServerId, current.selectedServerId)
  }))
}));
