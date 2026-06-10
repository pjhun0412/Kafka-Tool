import { create } from "zustand";
import type { BrokerSummary } from "../../../shared/types";
import { resolveValue, type SetValue } from "./storeUtils";

type BrokerResourceStore = {
  brokersByServer: Record<string, BrokerSummary[]>;
  setBrokersByServer: (value: SetValue<Record<string, BrokerSummary[]>>) => void;
};

export const useBrokerResourceStore = create<BrokerResourceStore>((set) => ({
  brokersByServer: {},
  setBrokersByServer: (brokersByServer) => set((current) => ({
    brokersByServer: resolveValue(brokersByServer, current.brokersByServer)
  }))
}));
