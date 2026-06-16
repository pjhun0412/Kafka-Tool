import { create } from "zustand";
import type { ExportSettingsOptions, ImportSettingsOptions } from "../../../shared/types";

type SettingsTransferDialogKind = "export" | "import";

type SettingsTransferDialogStore = {
  kind: SettingsTransferDialogKind | null;
  resolveExport: ((options: ExportSettingsOptions | null) => void) | null;
  resolveImport: ((options: ImportSettingsOptions | null) => void) | null;
  requestExportOptions: () => Promise<ExportSettingsOptions | null>;
  requestImportOptions: () => Promise<ImportSettingsOptions | null>;
  closeSettingsTransferDialog: () => void;
  submitExportOptions: (options: ExportSettingsOptions) => void;
  submitImportOptions: (options: ImportSettingsOptions) => void;
};

export const useSettingsTransferDialogStore = create<SettingsTransferDialogStore>((set, get) => ({
  kind: null,
  resolveExport: null,
  resolveImport: null,
  requestExportOptions: () => new Promise((resolve) => {
    set({ kind: "export", resolveExport: resolve, resolveImport: null });
  }),
  requestImportOptions: () => new Promise((resolve) => {
    set({ kind: "import", resolveExport: null, resolveImport: resolve });
  }),
  closeSettingsTransferDialog: () => {
    const { kind, resolveExport, resolveImport } = get();
    if (kind === "export") resolveExport?.(null);
    if (kind === "import") resolveImport?.(null);
    set({ kind: null, resolveExport: null, resolveImport: null });
  },
  submitExportOptions: (options) => {
    get().resolveExport?.(options);
    set({ kind: null, resolveExport: null, resolveImport: null });
  },
  submitImportOptions: (options) => {
    get().resolveImport?.(options);
    set({ kind: null, resolveExport: null, resolveImport: null });
  }
}));
