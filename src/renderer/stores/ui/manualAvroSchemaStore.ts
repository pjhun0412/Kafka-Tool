import { create } from "zustand";
import type { ManualAvroSchema } from "../../../shared/types";

type SetValue<T> = T | ((current: T) => T);

export const emptyManualAvroForm = {
  serverId: "",
  topic: "",
  encoding: "raw" as ManualAvroSchema["encoding"],
  schemaId: "",
  schema: "",
  error: ""
};

export type ManualAvroForm = typeof emptyManualAvroForm;

type ManualAvroSchemaStore = {
  manualAvroForm: ManualAvroForm;
  isManualAvroOpen: boolean;
  isSchemaDragOver: boolean;
  setManualAvroForm: (manualAvroForm: SetValue<ManualAvroForm>) => void;
  setIsManualAvroOpen: (isManualAvroOpen: SetValue<boolean>) => void;
  setIsSchemaDragOver: (isSchemaDragOver: SetValue<boolean>) => void;
  closeManualAvroForm: () => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useManualAvroSchemaStore = create<ManualAvroSchemaStore>((set) => ({
  manualAvroForm: emptyManualAvroForm,
  isManualAvroOpen: false,
  isSchemaDragOver: false,
  setManualAvroForm: (manualAvroForm) => set((current) => ({
    manualAvroForm: resolveValue(manualAvroForm, current.manualAvroForm)
  })),
  setIsManualAvroOpen: (isManualAvroOpen) => set((current) => ({
    isManualAvroOpen: resolveValue(isManualAvroOpen, current.isManualAvroOpen)
  })),
  setIsSchemaDragOver: (isSchemaDragOver) => set((current) => ({
    isSchemaDragOver: resolveValue(isSchemaDragOver, current.isSchemaDragOver)
  })),
  closeManualAvroForm: () => set({
    isManualAvroOpen: false,
    isSchemaDragOver: false,
    manualAvroForm: emptyManualAvroForm
  })
}));
