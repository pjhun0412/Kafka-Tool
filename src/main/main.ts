import { app, BrowserWindow, dialog, Menu } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkForUpdates as runUpdateCheck } from "./autoUpdate.js";
import { registerAppSettingsIpcHandlers } from "./ipc/appSettings.js";
import { registerBrokerIpcHandlers } from "./ipc/brokers.js";
import { registerConsumerGroupIpcHandlers } from "./ipc/consumerGroups.js";
import { createConsumeProduceService, nextOffset } from "./ipc/consumeProduce.js";
import { registerMessageExportIpcHandlers } from "./ipc/messageExport.js";
import { registerServerIpcHandlers } from "./ipc/servers.js";
import { registerTopicIpcHandlers } from "./ipc/topics.js";
import {
  appIconPath,
  normalizeImportedServers,
  normalizePreferences,
  readPreferences,
  readProfiles,
  writePreferences,
  writeProfiles
} from "./storage.js";
import type {
  AppMenuLanguage,
  AppSettingsBundle,
  ImportSettingsResult,
  ServerProfile,
  UpdateStatus
} from "../shared/types.js";

const devServerUrl = process.env.KAFKA_TOOL_DEV_SERVER_URL;
let mainWindow: BrowserWindow | null = null;
let windowBoundsSaveTimer: NodeJS.Timeout | null = null;
const appUserModelId = "local.kafka-tool";
let isCleaningUpConsumers = false;
let menuLanguage: AppMenuLanguage = app.getLocale().toLowerCase().startsWith("ko") ? "ko" : "en";

function resolveMenuLanguage(preference: "auto" | "ko" | "en" | undefined): AppMenuLanguage {
  if (preference === "ko" || preference === "en") return preference;
  return app.getLocale().toLowerCase().startsWith("ko") ? "ko" : "en";
}

async function exportSettingsToFile() {
  if (!mainWindow) return null;
  const result = await dialog.showSaveDialog(mainWindow, {
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
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
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
  await consumeProduceService.stopActiveConsumer();
  return { servers, preferences };
}

const menuText = {
  ko: {
    file: "파일",
    importSettings: "설정 가져오기...",
    exportSettings: "설정 내보내기...",
    preferences: "환경설정...",
    avroSchemas: "Avro Schemas...",
    checkUpdates: "업데이트 확인...",
    close: "닫기",
    quit: "종료",
    importTitle: "설정 가져오기",
    importMessage: "현재 서버 목록과 환경설정을 가져온 파일로 교체할까요?",
    importButton: "가져오기",
    cancelButton: "취소",
    help: "도움말",
    shortcuts: "단축키",
    splitTabs: "탭 분할",
    searchTips: "검색과 필터",
    kafkaTips: "Kafka 작업 팁",
    about: "Kafka Tool 정보",
    helpOk: "확인",
    helpShortcutsTitle: "단축키",
    helpShortcutsMessage: [
      "Ctrl+P 또는 Ctrl+K: Quick Search를 엽니다.",
      "Ctrl+O: 설정 파일을 가져옵니다.",
      "Ctrl+S: 설정 파일을 내보냅니다.",
      "Ctrl+,: 환경설정을 엽니다.",
      "Topic, Consumer, Broker 목록에서 행을 클릭하면 상세 화면으로 이동합니다."
    ].join("\n"),
    helpSplitTitle: "탭 분할",
    helpSplitMessage: [
      "Cluster 탭이나 Topic 탭을 드래그해 작업 영역을 분할할 수 있습니다.",
      "분할 닫기 영역으로 탭을 놓으면 분할 패널을 닫습니다.",
      "분할 상태는 서버별로 유지됩니다.",
      "Consume 화면에서는 메시지 목록과 JSON Viewer 사이 경계선을 드래그해 높이를 조절할 수 있습니다."
    ].join("\n"),
    helpSearchTitle: "검색과 필터",
    helpSearchMessage: [
      "Topics 검색은 공백 AND 검색, -단어 제외, /pattern/ 정규식을 지원합니다.",
      "Quick Search에서 @\"Server Name\" topic 형식으로 특정 서버 안에서 찾을 수 있습니다.",
      "Consume 필터는 key:, value:, headers:, empty:, 정규식, JSON path 비교식을 지원합니다.",
      "Grid 컬럼의 필터 아이콘으로 컬럼별 텍스트 또는 범위 필터를 적용할 수 있습니다."
    ].join("\n"),
    helpKafkaTitle: "Kafka 작업 팁",
    helpKafkaMessage: [
      "Topic 우클릭 메뉴에서 열기, 이름 복사, Avro Schema 등록, 메시지 비우기, 삭제를 실행할 수 있습니다.",
      "Topic Settings에서는 Kafka가 수정 가능하다고 알려준 config만 편집합니다.",
      "Consumer 상세에서는 Topic별로 접고 펼쳐 Lag와 offset을 확인할 수 있습니다.",
      "대량 Consume 조회는 가상화 Grid로 렌더링되며, Offset 조회는 Prev/Next로 페이지 이동할 수 있습니다."
    ].join("\n"),
    aboutTitle: "Kafka Tool 정보",
    aboutMessage: "Kafka Tool 데스크톱 클라이언트\nTopic, Consumer, Broker, Produce/Consume 작업을 한곳에서 관리합니다.",
    saveLiveRecord: "Live Record 저장"
  },  en: {
    file: "File",
    importSettings: "Import Settings...",
    exportSettings: "Export Settings...",
    preferences: "Preferences...",
    avroSchemas: "Avro Schemas...",
    checkUpdates: "Check for Updates...",
    close: "Close",
    quit: "Quit",
    importTitle: "Import Settings",
    importMessage: "Replace the current server list and preferences with the imported file?",
    importButton: "Import",
    cancelButton: "Cancel",
    help: "Help",
    shortcuts: "Shortcuts",
    splitTabs: "Split tabs",
    searchTips: "Search and filters",
    kafkaTips: "Kafka work tips",
    about: "About Kafka Tool",
    helpOk: "OK",
    helpShortcutsTitle: "Shortcuts",
    helpShortcutsMessage: [
      "Ctrl+P or Ctrl+K: open Quick Search.",
      "Ctrl+O: import settings.",
      "Ctrl+S: export settings.",
      "Ctrl+,: open Preferences.",
      "Click rows in Topic, Consumer, or Broker lists to open details."
    ].join("\n"),
    helpSplitTitle: "Split tabs",
    helpSplitMessage: [
      "Drag cluster tabs or Topic tabs to split the workspace.",
      "Drop a tab onto the close split drop zone to close the split pane.",
      "Split pane state is kept per server.",
      "Drag the divider between the Consume message grid and JSON Viewer to resize them."
    ].join("\n"),
    helpSearchTitle: "Search and filters",
    helpSearchMessage: [
      "Topics search supports AND with spaces, exclusion with -word, and regex with /pattern/.",
      "Use @\"Server Name\" topic in Quick Search to search inside one server.",
      "Consume filters support key:, value:, headers:, empty:, regex, and JSON path comparisons.",
      "Use each grid column's filter icon for column text/range filters."
    ].join("\n"),
    helpKafkaTitle: "Kafka work tips",
    helpKafkaMessage: [
      "Topic context menus can open, copy names, register Avro Schema, clear messages, or delete Topics.",
      "Topic Settings only edits configs Kafka reports as editable.",
      "Consumer details can expand/collapse by Topic to inspect Lag and offsets.",
      "Large Consume results use a virtualized grid, and Offset queries support Prev/Next paging."
    ].join("\n"),
    aboutTitle: "About Kafka Tool",
    aboutMessage: "Kafka Tool desktop client\nManage Topics, Consumers, Brokers, Produce, and Consume workflows in one place.",
    saveLiveRecord: "Save Live Record"
  }
} satisfies Record<AppMenuLanguage, Record<string, string>>;

function showHelpDialog(title: string, message: string) {
  if (!mainWindow) return;
  const labels = menuText[menuLanguage];
  void dialog.showMessageBox(mainWindow, {
    type: "info",
    buttons: [labels.helpOk],
    defaultId: 0,
    title,
    message
  });
}

function createApplicationMenu() {
  const labels = menuText[menuLanguage];
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: labels.file,
      submenu: [
        {
          label: labels.importSettings,
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            if (!mainWindow) return;
            const confirm = await dialog.showMessageBox(mainWindow, {
              type: "question",
              buttons: [labels.importButton, labels.cancelButton],
              defaultId: 0,
              cancelId: 1,
              title: labels.importTitle,
              message: labels.importMessage
            });
            if (confirm.response !== 0) return;
            try {
              const result = await importSettingsFromFile();
              if (result) {
                mainWindow.webContents.send("settings:imported", result);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              mainWindow.webContents.send("settings:error", message);
            }
          }
        },
        {
          label: labels.exportSettings,
          accelerator: "CmdOrCtrl+S",
          click: async () => {
            if (!mainWindow) return;
            try {
              const filePath = await exportSettingsToFile();
              if (filePath) {
                mainWindow.webContents.send("settings:exported", filePath);
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              mainWindow.webContents.send("settings:error", message);
            }
          }
        },
        { type: "separator" },
        {
          label: labels.preferences,
          accelerator: "CmdOrCtrl+,",
          click: () => {
            mainWindow?.webContents.send("preferences:open", "general");
          }
        },
        {
          label: labels.avroSchemas,
          click: () => {
            mainWindow?.webContents.send("preferences:open", "avro");
          }
        },
        { type: "separator" },
        {
          label: labels.checkUpdates,
          click: async () => {
            try {
              await checkForUpdates();
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              mainWindow?.webContents.send("updates:status", {
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

function sendUpdateStatus(status: UpdateStatus) {
  mainWindow?.webContents.send("updates:status", status);
}

async function checkForUpdates() {
  await runUpdateCheck({
    getWindow: () => mainWindow,
    sendStatus: sendUpdateStatus
  });
}

async function saveWindowBounds() {
  const window = mainWindow;
  if (!window || window.isDestroyed()) return;
  const bounds = window.getNormalBounds();
  const maximized = window.isMaximized();
  const preferences = await readPreferences();
  await writePreferences({
    ...preferences,
    windowBounds: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized
    }
  });
}

function scheduleWindowBoundsSave() {
  if (windowBoundsSaveTimer) {
    clearTimeout(windowBoundsSaveTimer);
  }
  windowBoundsSaveTimer = setTimeout(() => {
    windowBoundsSaveTimer = null;
    void saveWindowBounds();
  }, 400);
}

async function createWindow() {
  const preloadPath = path.join(app.getAppPath(), "dist/preload/preload.js");
  const preferences = await readPreferences();
  menuLanguage = resolveMenuLanguage(preferences.appearance?.language);
  const windowBounds = preferences.windowBounds;
  mainWindow = new BrowserWindow({
    width: windowBounds?.width ?? 1320,
    height: windowBounds?.height ?? 860,
    x: windowBounds?.x,
    y: windowBounds?.y,
    minWidth: 1100,
    minHeight: 720,
    title: "Kafka Tool",
    icon: appIconPath(),
    autoHideMenuBar: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  if (windowBounds?.maximized) {
    mainWindow.maximize();
  }
  createApplicationMenu();

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Renderer failed to load", { errorCode, errorDescription, validatedURL });
  });

  mainWindow.webContents.on("console-message", (_event, level, message) => {
    console.log(`Renderer console[${level}]: ${message}`);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.on("resize", scheduleWindowBoundsSave);
  mainWindow.on("move", scheduleWindowBoundsSave);
  mainWindow.on("maximize", scheduleWindowBoundsSave);
  mainWindow.on("unmaximize", scheduleWindowBoundsSave);
  mainWindow.on("close", () => {
    void saveWindowBounds();
  });

  try {
    if (devServerUrl) {
      await mainWindow.loadURL(devServerUrl);
      mainWindow.webContents.openDevTools({ mode: "detach" });
      return;
    }
    await mainWindow.loadFile(path.join(app.getAppPath(), "dist/renderer/index.html"));
  } catch (error) {
    console.error("Failed to load renderer", error);
  }

  if (app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates().catch((error) => {
        sendUpdateStatus({
          status: "error",
          message: error instanceof Error ? error.message : String(error)
        });
      });
    }, 3000);
  }
}

const consumeProduceService = createConsumeProduceService({
  getWindow: () => mainWindow,
  getLiveRecordTitle: () => menuText[menuLanguage].saveLiveRecord
});

registerServerIpcHandlers();
registerAppSettingsIpcHandlers({
  checkForUpdates,
  createApplicationMenu,
  exportSettingsToFile,
  importSettingsFromFile,
  setMenuLanguage: (language) => {
    menuLanguage = language;
  }
});
registerBrokerIpcHandlers();
registerConsumerGroupIpcHandlers();
registerMessageExportIpcHandlers({
  getWindow: () => mainWindow,
  consumeOffsetBatch: consumeProduceService.consumeOffsetBatch,
  nextOffset
});
registerTopicIpcHandlers();
consumeProduceService.registerIpcHandlers();

if (process.platform === "win32") {
  app.setAppUserModelId(appUserModelId);
}

app.whenReady().then(createWindow);

app.on("before-quit", (event) => {
  if (isCleaningUpConsumers || !consumeProduceService.hasActiveConsumers()) {
    return;
  }
  event.preventDefault();
  isCleaningUpConsumers = true;
  void consumeProduceService.stopActiveConsumer()
    .finally(() => {
      isCleaningUpConsumers = false;
      app.quit();
    });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

async function cleanupConsumersAndExit() {
  if (isCleaningUpConsumers) return;
  isCleaningUpConsumers = true;
  await consumeProduceService.stopActiveConsumer();
  process.exit(0);
}

process.on("SIGINT", () => {
  void cleanupConsumersAndExit();
});

process.on("SIGTERM", () => {
  void cleanupConsumersAndExit();
});
