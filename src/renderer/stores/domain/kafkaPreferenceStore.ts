import { create } from "zustand";
import type { AppPreferences, ManualAvroSchema } from "../../../shared/types";
import { resolveValue, type SetValue } from "./storeUtils";

type KafkaPreferenceStore = {
  consumeDefaultsByServer: AppPreferences["consumeDefaultsByServer"];
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  preferencesLoaded: boolean;
  setConsumeDefaultsByServer: (value: SetValue<AppPreferences["consumeDefaultsByServer"]>) => void;
  setManualAvroSchemasByServer: (value: SetValue<Record<string, Record<string, ManualAvroSchema>>>) => void;
  setPreferencesLoaded: (value: SetValue<boolean>) => void;
};

export const useKafkaPreferenceStore = create<KafkaPreferenceStore>((set) => ({
  consumeDefaultsByServer: {},
  manualAvroSchemasByServer: {},
  preferencesLoaded: false,
  setConsumeDefaultsByServer: (consumeDefaultsByServer) => set((current) => ({
    consumeDefaultsByServer: resolveValue(consumeDefaultsByServer, current.consumeDefaultsByServer)
  })),
  setManualAvroSchemasByServer: (manualAvroSchemasByServer) => set((current) => ({
    manualAvroSchemasByServer: resolveValue(manualAvroSchemasByServer, current.manualAvroSchemasByServer)
  })),
  setPreferencesLoaded: (preferencesLoaded) => set((current) => ({
    preferencesLoaded: resolveValue(preferencesLoaded, current.preferencesLoaded)
  }))
}));
