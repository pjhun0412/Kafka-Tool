import { create } from "zustand";

export const DEFAULT_FONT_FAMILY = "D2Coding, Consolas, 'Courier New', monospace";
export const DEFAULT_EXPORT_FORMAT_TEMPLATE = "[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}";

type SetValue<T> = T | ((current: T) => T);

type LayoutStore = {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  serverPanelHeight: number;
  messagePaneHeight: number;
  fontFamily: string;
  fontSize: number;
  exportFormatTemplate: string;
  setSidebarWidth: (value: SetValue<number>) => void;
  setSidebarCollapsed: (value: SetValue<boolean>) => void;
  setServerPanelHeight: (value: SetValue<number>) => void;
  setMessagePaneHeight: (value: SetValue<number>) => void;
  setFontFamily: (value: SetValue<string>) => void;
  setFontSize: (value: SetValue<number>) => void;
  setExportFormatTemplate: (value: SetValue<string>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarWidth: 288,
  sidebarCollapsed: false,
  serverPanelHeight: 230,
  messagePaneHeight: 230,
  fontFamily: DEFAULT_FONT_FAMILY,
  fontSize: 13,
  exportFormatTemplate: DEFAULT_EXPORT_FORMAT_TEMPLATE,
  setSidebarWidth: (sidebarWidth) => set((current) => ({ sidebarWidth: resolveValue(sidebarWidth, current.sidebarWidth) })),
  setSidebarCollapsed: (sidebarCollapsed) => set((current) => ({ sidebarCollapsed: resolveValue(sidebarCollapsed, current.sidebarCollapsed) })),
  setServerPanelHeight: (serverPanelHeight) => set((current) => ({ serverPanelHeight: resolveValue(serverPanelHeight, current.serverPanelHeight) })),
  setMessagePaneHeight: (messagePaneHeight) => set((current) => ({ messagePaneHeight: resolveValue(messagePaneHeight, current.messagePaneHeight) })),
  setFontFamily: (fontFamily) => set((current) => ({ fontFamily: resolveValue(fontFamily, current.fontFamily) })),
  setFontSize: (fontSize) => set((current) => ({ fontSize: resolveValue(fontSize, current.fontSize) })),
  setExportFormatTemplate: (exportFormatTemplate) => set((current) => ({
    exportFormatTemplate: resolveValue(exportFormatTemplate, current.exportFormatTemplate)
  }))
}));
