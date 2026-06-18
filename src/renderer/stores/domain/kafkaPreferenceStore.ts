import { create } from "zustand";
import type { AppPreferences, ManualAvroSchema, ProduceTemplatePreference } from "../../../shared/types";
import { normalizeViewerPreferences, type ViewerPreferences } from "../../viewerPreferences";
import { resolveValue, type SetValue } from "./storeUtils";

type KafkaPreferenceStore = {
  consumeDefaults: NonNullable<AppPreferences["consumeDefaults"]>;
  viewerPreferences: Required<ViewerPreferences>;
  consumeDefaultsByServer: AppPreferences["consumeDefaultsByServer"];
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  produceTemplatesByServer: Record<string, Record<string, ProduceTemplatePreference[]>>;
  preferencesLoaded: boolean;
  setConsumeDefaults: (value: SetValue<NonNullable<AppPreferences["consumeDefaults"]>>) => void;
  setViewerPreferences: (value: SetValue<Required<ViewerPreferences>>) => void;
  setConsumeDefaultsByServer: (value: SetValue<AppPreferences["consumeDefaultsByServer"]>) => void;
  setManualAvroSchemasByServer: (value: SetValue<Record<string, Record<string, ManualAvroSchema>>>) => void;
  setProduceTemplatesByServer: (value: SetValue<Record<string, Record<string, ProduceTemplatePreference[]>>>) => void;
  setPreferencesLoaded: (value: SetValue<boolean>) => void;
};

export const useKafkaPreferenceStore = create<KafkaPreferenceStore>((set) => ({
  consumeDefaults: {
    inspectorMode: "raw",
    inspectorCollapsed: false,
    keyFormat: "text",
    valueFormat: "json",
    payloadEncoding: "utf-8"
  },
  viewerPreferences: normalizeViewerPreferences(),
  consumeDefaultsByServer: {},
  manualAvroSchemasByServer: {},
  produceTemplatesByServer: {},
  preferencesLoaded: false,
  setConsumeDefaults: (consumeDefaults) => set((current) => ({
    consumeDefaults: resolveValue(consumeDefaults, current.consumeDefaults)
  })),
  setViewerPreferences: (viewerPreferences) => set((current) => ({
    viewerPreferences: resolveValue(viewerPreferences, current.viewerPreferences)
  })),
  setConsumeDefaultsByServer: (consumeDefaultsByServer) => set((current) => ({
    consumeDefaultsByServer: resolveValue(consumeDefaultsByServer, current.consumeDefaultsByServer)
  })),
  setManualAvroSchemasByServer: (manualAvroSchemasByServer) => set((current) => ({
    manualAvroSchemasByServer: resolveValue(manualAvroSchemasByServer, current.manualAvroSchemasByServer)
  })),
  setProduceTemplatesByServer: (produceTemplatesByServer) => set((current) => ({
    produceTemplatesByServer: resolveValue(produceTemplatesByServer, current.produceTemplatesByServer)
  })),
  setPreferencesLoaded: (preferencesLoaded) => set((current) => ({
    preferencesLoaded: resolveValue(preferencesLoaded, current.preferencesLoaded)
  }))
}));
