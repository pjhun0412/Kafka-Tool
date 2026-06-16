import { app, dialog, Menu, type BrowserWindow } from "electron";
import { openLogsFolder } from "./logger.js";
import { menuText } from "./menuText.js";
import type { AppMenuLanguage, ImportSettingsResult, UpdateStatus } from "../shared/types.js";


export function resolveMenuLanguage(preference: "auto" | "ko" | "en" | undefined): AppMenuLanguage {
  if (preference === "ko" || preference === "en") return preference;
  return app.getLocale().toLowerCase().startsWith("ko") ? "ko" : "en";
}

export function getLiveRecordTitle(language: AppMenuLanguage) {
  return menuText[language].saveLiveRecord;
}

export function createApplicationMenu(options: {
  getWindow: () => BrowserWindow | null;
  getLanguage: () => AppMenuLanguage;
  checkForUpdates: () => Promise<void>;
  exportSettingsToFile: () => Promise<string | null>;
  importSettingsFromFile: () => Promise<ImportSettingsResult | null>;
}) {
  const labels = menuText[options.getLanguage()];

  function showHelpDialog(title: string, message: string) {
    const window = options.getWindow();
    if (!window) return;
    void dialog.showMessageBox(window, {
      type: "info",
      buttons: [labels.helpOk],
      defaultId: 0,
      title,
      message
    });
  }

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: labels.file,
      submenu: [
        {
          label: labels.importSettings,
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            const window = options.getWindow();
            if (!window) return;
            window.webContents.send("settings:import-requested");
          }
        },
        {
          label: labels.exportSettings,
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            const window = options.getWindow();
            if (!window) return;
            window.webContents.send("settings:export-requested");
          }
        },
        { type: "separator" },
        {
          label: labels.preferences,
          accelerator: "CmdOrCtrl+,",
          click: () => {
            options.getWindow()?.webContents.send("preferences:open", "general");
          }
        },
        {
          label: labels.avroSchemas,
          click: () => {
            options.getWindow()?.webContents.send("preferences:open", "avro");
          }
        },
        { type: "separator" },
        {
          label: labels.checkUpdates,
          click: async () => {
            try {
              await options.checkForUpdates();
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              options.getWindow()?.webContents.send("updates:status", {
                status: "error",
                message
              } satisfies UpdateStatus);
            }
          }
        },
        { type: "separator" },
        process.platform === "darwin"
          ? { label: labels.close, role: "close" }
          : { label: labels.quit, click: () => app.quit() }
      ]
    },
    {
      label: labels.help,
      submenu: [
        {
          label: labels.shortcuts,
          click: () => showHelpDialog(labels.helpShortcutsTitle, labels.helpShortcutsMessage)
        },
        {
          label: labels.splitTabs,
          click: () => showHelpDialog(labels.helpSplitTitle, labels.helpSplitMessage)
        },
        {
          label: labels.searchTips,
          click: () => showHelpDialog(labels.helpSearchTitle, labels.helpSearchMessage)
        },
        {
          label: labels.kafkaTips,
          click: () => showHelpDialog(labels.helpKafkaTitle, labels.helpKafkaMessage)
        },
        {
          label: labels.viewerTips,
          click: () => showHelpDialog(labels.helpViewerTitle, labels.helpViewerMessage)
        },
        {
          label: labels.recordTips,
          click: () => showHelpDialog(labels.helpRecordTitle, labels.helpRecordMessage)
        },
        {
          label: labels.releaseNotes,
          click: () => options.getWindow()?.webContents.send("release-notes:open")
        },
        {
          label: options.getLanguage() === "ko" ? "로그 폴더 열기" : "Open Logs Folder",
          click: async () => {
            try {
              const error = await openLogsFolder();
              if (error) options.getWindow()?.webContents.send("settings:error", error);
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              options.getWindow()?.webContents.send("settings:error", message);
            }
          }
        },
        { type: "separator" },
        {
          label: labels.about,
          click: () => showHelpDialog(labels.aboutTitle, labels.aboutMessage)
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
