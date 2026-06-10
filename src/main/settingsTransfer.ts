import { dialog, type BrowserWindow } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import {
  normalizeImportedServers,
  normalizePreferences,
  readPreferences,
  readProfiles,
  writePreferences,
  writeProfiles
} from "./storage.js";
import type { AppSettingsBundle, ImportSettingsResult, ServerProfile } from "../shared/types.js";

export function createSettingsTransferActions(options: {
  getWindow: () => BrowserWindow | null;
  stopActiveConsumer: () => Promise<void>;
}) {
  async function exportSettingsToFile() {
    const window = options.getWindow();
    if (!window) return null;
    const result = await dialog.showSaveDialog(window, {
      title: "Export Kafka Tool settings",
      defaultPath: `kafka-tool-settings-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || !result.filePath) {
      return null;
    }
    const bundle: AppSettingsBundle = {
      version: 1,
      exportedAt: new Date().toISOString(),
      servers: await readProfiles(),
      preferences: await readPreferences()
    };
    await writeFile(result.filePath, JSON.stringify(bundle, null, 2), "utf8");
    return result.filePath;
  }

  async function importSettingsFromFile(): Promise<ImportSettingsResult | null> {
    const window = options.getWindow();
    if (!window) return null;
    const result = await dialog.showOpenDialog(window, {
      title: "Import Kafka Tool settings",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    const file = await readFile(result.filePaths[0], "utf8");
    const parsed = JSON.parse(file) as Partial<AppSettingsBundle> | ServerProfile[];
    const servers = normalizeImportedServers(Array.isArray(parsed) ? parsed : parsed.servers);
    const preferences = normalizePreferences(Array.isArray(parsed) ? undefined : parsed.preferences);
    await writeProfiles(servers);
    await writePreferences(preferences);
    await options.stopActiveConsumer();
    return { servers, preferences };
  }

  return {
    exportSettingsToFile,
    importSettingsFromFile
  };
}
