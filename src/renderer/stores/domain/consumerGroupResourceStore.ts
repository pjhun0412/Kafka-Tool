import { create } from "zustand";
import type { ConsumerGroupLagDetail, ConsumerGroupSummary } from "../../../shared/types";
import { resolveValue, type SetValue } from "./storeUtils";

type ConsumerGroupResourceStore = {
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
  selectedGroupByServer: Record<string, string>;
  groupLagByServer: Record<string, Record<string, ConsumerGroupLagDetail>>;
  setGroupsByServer: (value: SetValue<Record<string, ConsumerGroupSummary[]>>) => void;
  setSelectedGroupByServer: (value: SetValue<Record<string, string>>) => void;
  setGroupLagByServer: (value: SetValue<Record<string, Record<string, ConsumerGroupLagDetail>>>) => void;
};

export const useConsumerGroupResourceStore = create<ConsumerGroupResourceStore>((set) => ({
  groupsByServer: {},
  selectedGroupByServer: {},
  groupLagByServer: {},
  setGroupsByServer: (groupsByServer) => set((current) => ({
    groupsByServer: resolveValue(groupsByServer, current.groupsByServer)
  })),
  setSelectedGroupByServer: (selectedGroupByServer) => set((current) => ({
    selectedGroupByServer: resolveValue(selectedGroupByServer, current.selectedGroupByServer)
  })),
  setGroupLagByServer: (groupLagByServer) => set((current) => ({
    groupLagByServer: resolveValue(groupLagByServer, current.groupLagByServer)
  }))
}));
