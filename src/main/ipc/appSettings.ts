import { ipcMain } from "electron";
import type { AppMenuLanguage, AppPreferences, ImportSettingsResult } from "../../shared/types.js";
import { installUpdate } from "../autoUpdate.js";
import { mergePreferences, readPreferences, writePreferences } from "../storage.js";

type AppSettingsIpcParams = {
  checkForUpdates: () => Promise<void>;
  createApplicationMenu: () => void;
  exportSettingsToFile: () => Promise<string | null>;
  importSettingsFromFile: () => Promise<ImportSettingsResult | null>;
  setMenuLanguage: (language: AppMenuLanguage) => void;
};

export function registerAppSettingsIpcHandlers({
  checkForUpdates,
  createApplicationMenu,
  exportSettingsToFile,
  importSettingsFromFile,
  setMenuLanguage,
}: AppSettingsIpcParams) {
  ipcMain.handle("settings:export", async (): Promise<string | null> => {
    return exportSettingsToFile();
  });

  ipcMain.handle("settings:import", async (): Promise<ImportSettingsResult | null> => {
    return importSettingsFromFile();
  });

  ipcMain.handle("updates:check", async () => {
    await checkForUpdates();
  });

  ipcMain.handle("updates:install", async () => {
    installUpdate();
  });

  ipcMain.handle("preferences:load", async () => readPreferences());

  ipcMain.handle("preferences:save", async (_event, preferences: AppPreferences) => {
    const mergedPreferences = mergePreferences(await readPreferences(), preferences);
    await writePreferences(mergedPreferences);
    return mergedPreferences;
  });

  ipcMain.handle("menu:set-language", async (_event, language: AppMenuLanguage) => {
    if (language !== "ko" && language !== "en") return;
    setMenuLanguage(language);
    createApplicationMenu();
  });
}
