import { app, dialog, Menu, type BrowserWindow } from "electron";
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
            const confirm = await dialog.showMessageBox(window, {
              type: "question",
              buttons: [labels.importButton, labels.cancelButton],
              defaultId: 0,
              cancelId: 1,
              title: labels.importTitle,
              message: labels.importMessage
            });
            if (confirm.response !== 0) return;
            try {
              const result = await options.importSettingsFromFile();
              if (result) {
                window.webContents.send("settings:imported", result);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              window.webContents.send("settings:error", message);
            }
          }
        },
        {
          label: labels.exportSettings,
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            const window = options.getWindow();
            if (!window) return;
            try {
              const filePath = await options.exportSettingsToFile();
              if (filePath) {
                window.webContents.send("settings:exported", filePath);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              window.webContents.send("settings:error", message);
            }
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
