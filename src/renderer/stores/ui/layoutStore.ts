import { create } from "zustand";
import type { AppKeyboardShortcutPreferences } from "../../../shared/types";
import { INTER_FONT_FAMILY } from "../../fontConfig";
import type { LanguagePreference } from "../../i18n";
import { defaultKeyboardShortcuts, normalizeKeyboardShortcutMap, type KeyboardShortcutMap } from "../../keyboardShortcuts";

export const DEFAULT_FONT_FAMILY = INTER_FONT_FAMILY;
export const DEFAULT_EXPORT_FORMAT_TEMPLATE = "[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}";
export const DEFAULT_LANGUAGE: LanguagePreference = "auto";
export const DEFAULT_KEYBOARD_SHORTCUTS = defaultKeyboardShortcuts;

type SetValue<T> = T | ((current: T) => T);

type LayoutStore = {
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  serverPanelHeight: number;
  messagePaneHeight: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  language: LanguagePreference;
  exportFormatTemplate: string;
  keyboardShortcuts: KeyboardShortcutMap;
  logRetentionDays: number;
  appVersion: string;
  lastSeenReleaseVersion: string;
  setSidebarWidth: (value: SetValue<number>) => void;
  setSidebarCollapsed: (value: SetValue<boolean>) => void;
  setServerPanelHeight: (value: SetValue<number>) => void;
  setMessagePaneHeight: (value: SetValue<number>) => void;
  setFontFamily: (value: SetValue<string>) => void;
  setFontSize: (value: SetValue<number>) => void;
  setFontWeight: (value: SetValue<number>) => void;
  setLanguage: (value: SetValue<LanguagePreference>) => void;
  setExportFormatTemplate: (value: SetValue<string>) => void;
  setKeyboardShortcuts: (value: SetValue<AppKeyboardShortcutPreferences>) => void;
  setLogRetentionDays: (value: SetValue<number>) => void;
  setAppVersion: (value: SetValue<string>) => void;
  setLastSeenReleaseVersion: (value: SetValue<string>) => void;
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
  fontWeight: 600,
  language: DEFAULT_LANGUAGE,
  exportFormatTemplate: DEFAULT_EXPORT_FORMAT_TEMPLATE,
  keyboardShortcuts: DEFAULT_KEYBOARD_SHORTCUTS,
  logRetentionDays: 14,
  appVersion: "",
  lastSeenReleaseVersion: "",
  setSidebarWidth: (sidebarWidth) => set((current) => ({ sidebarWidth: resolveValue(sidebarWidth, current.sidebarWidth) })),
  setSidebarCollapsed: (sidebarCollapsed) => set((current) => ({ sidebarCollapsed: resolveValue(sidebarCollapsed, current.sidebarCollapsed) })),
  setServerPanelHeight: (serverPanelHeight) => set((current) => ({ serverPanelHeight: resolveValue(serverPanelHeight, current.serverPanelHeight) })),
  setMessagePaneHeight: (messagePaneHeight) => set((current) => ({ messagePaneHeight: resolveValue(messagePaneHeight, current.messagePaneHeight) })),
  setFontFamily: (fontFamily) => set((current) => ({ fontFamily: resolveValue(fontFamily, current.fontFamily) })),
  setFontSize: (fontSize) => set((current) => ({ fontSize: resolveValue(fontSize, current.fontSize) })),
  setFontWeight: (fontWeight) => set((current) => ({
    fontWeight: Math.min(900, Math.max(400, Math.round(resolveValue(fontWeight, current.fontWeight) || 600)))
  })),
  setLanguage: (language) => set((current) => ({ language: resolveValue(language, current.language) })),
  setExportFormatTemplate: (exportFormatTemplate) => set((current) => ({
    exportFormatTemplate: resolveValue(exportFormatTemplate, current.exportFormatTemplate)
  })),
  setKeyboardShortcuts: (keyboardShortcuts) => set((current) => ({
    keyboardShortcuts: normalizeKeyboardShortcutMap(resolveValue(keyboardShortcuts, current.keyboardShortcuts))
  })),
  setLogRetentionDays: (logRetentionDays) => set((current) => ({
    logRetentionDays: Math.min(365, Math.max(1, Math.round(resolveValue(logRetentionDays, current.logRetentionDays) || 14)))
  })),
  setAppVersion: (appVersion) => set((current) => ({
    appVersion: resolveValue(appVersion, current.appVersion)
  })),
  setLastSeenReleaseVersion: (lastSeenReleaseVersion) => set((current) => ({
    lastSeenReleaseVersion: resolveValue(lastSeenReleaseVersion, current.lastSeenReleaseVersion)
  }))
}));
