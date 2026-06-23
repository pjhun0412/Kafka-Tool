import { app, ipcMain, shell } from "electron";
import type { AppLogPayload, AppMenuLanguage, AppPreferences, ExportSettingsOptions, ImportSettingsOptions, ImportSettingsResult, LiveMapPoint } from "../../shared/types.js";
import { installUpdate } from "../autoUpdate.js";
import { logRendererError, openLogsFolder, pruneOldLogs } from "../logger.js";
import { mergePreferences, readPreferences, writePreferences } from "../storage.js";

type AppSettingsIpcParams = {
  checkForUpdates: () => Promise<void>;
  createApplicationMenu: () => void;
  exportSettingsToFile: (options?: ExportSettingsOptions) => Promise<string | null>;
  importSettingsFromFile: (options?: ImportSettingsOptions) => Promise<ImportSettingsResult | null>;
  clearLiveMapPoints: () => void;
  getLiveMapPoints: () => LiveMapPoint[];
  openLiveMapWindow: () => Promise<void>;
  sendLiveMapPoints: (points: LiveMapPoint[]) => void;
  setMenuLanguage: (language: AppMenuLanguage) => void;
};

export function registerAppSettingsIpcHandlers({
  checkForUpdates,
  createApplicationMenu,
  exportSettingsToFile,
  importSettingsFromFile,
  clearLiveMapPoints,
  getLiveMapPoints,
  openLiveMapWindow,
  sendLiveMapPoints,
  setMenuLanguage,
}: AppSettingsIpcParams) {
  ipcMain.handle("settings:export", async (_event, options?: ExportSettingsOptions): Promise<string | null> => {
    return exportSettingsToFile(options);
  });

  ipcMain.handle("settings:import", async (_event, options?: ImportSettingsOptions): Promise<ImportSettingsResult | null> => {
    return importSettingsFromFile(options);
  });

  ipcMain.handle("updates:check", async () => {
    await checkForUpdates();
  });

  ipcMain.handle("updates:install", async () => {
    installUpdate();
  });

  ipcMain.handle("app:version", async () => app.getVersion());

  ipcMain.handle("app:log-error", async (_event, payload: AppLogPayload) => {
    logRendererError(payload);
  });

  ipcMain.handle("app:open-logs-folder", async () => openLogsFolder());

  ipcMain.handle("app:open-external-url", async (_event, url: string) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "www.openstreetmap.org" || parsedUrl.pathname !== "/") {
      throw new Error("Unsupported external URL.");
    }
    await shell.openExternal(parsedUrl.toString());
  });

  ipcMain.handle("app:open-live-map", async () => {
    await openLiveMapWindow();
  });

  ipcMain.handle("app:send-live-map-points", async (_event, points: LiveMapPoint[]) => {
    sendLiveMapPoints(points);
  });

  ipcMain.handle("app:clear-live-map-points", async () => {
    clearLiveMapPoints();
  });

  ipcMain.handle("app:get-live-map-points", async () => {
    return getLiveMapPoints();
  });

  ipcMain.handle("preferences:load", async () => readPreferences());

  ipcMain.handle("preferences:save", async (_event, preferences: AppPreferences) => {
    const mergedPreferences = mergePreferences(await readPreferences(), preferences);
    await writePreferences(mergedPreferences);
    await pruneOldLogs(mergedPreferences.diagnostics?.logRetentionDays);
    return mergedPreferences;
  });

  ipcMain.handle("menu:set-language", async (_event, language: AppMenuLanguage) => {
    if (language !== "ko" && language !== "en") return;
    setMenuLanguage(language);
    createApplicationMenu();
  });
}
