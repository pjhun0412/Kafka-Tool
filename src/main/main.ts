import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ConfigResourceTypes, Kafka, logLevel, type Admin, type Consumer } from "kafkajs";
import { autoUpdater } from "electron-updater";
import { encodeManualAvro } from "./avroDecoder.js";
import { toConsumedMessage } from "./messageMapper.js";
import type {
  ConsumedMessage,
  ConsumeOffsetRequest,
  ConsumeOffsetResult,
  ConsumeTimeRangeRequest,
  AppPreferences,
  AppSettingsBundle,
  BrokerConfigEntry,
  BrokerConfigUpdateRequest,
  BrokerDetail,
  BrokerSummary,
  ConsumerGroupLagDetail,
  ConsumerGroupMutationRequest,
  ConsumerGroupSummary,
  ImportSettingsResult,
  MessageExportRequest,
  OffsetMessageExportRequest,
  ProduceRequest,
  ProducedMessage,
  ServerProfile,
  StartConsumeRequest,
  StopConsumeRequest,
  TopicConfigEntry,
  TopicConfigUpdateRequest,
  TopicDetail,
  TopicMessageCounts,
  TopicMutationRequest,
  TopicSummary,
  UpdateStatus
} from "../shared/types.js";

const devServerUrl = process.env.KAFKA_TOOL_DEV_SERVER_URL;
let mainWindow: BrowserWindow | null = null;
const activeConsumers = new Map<string, Consumer>();
let windowBoundsSaveTimer: NodeJS.Timeout | null = null;
let autoUpdaterConfigured = false;
const appUserModelId = "local.kafka-tool";
let isCleaningUpConsumers = false;

function appIconPath() {
  return path.join(app.getAppPath(), "build/icon.ico");
}

function profilesPath() {
  return path.join(app.getPath("userData"), "servers.json");
}

function preferencesPath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

const defaultPreferences: AppPreferences = {
  favoriteTopicsByServer: {},
  consumeDefaultsByServer: {},
  manualAvroSchemasByServer: {},
  layout: {},
  appearance: {
    fontFamily: "D2Coding, Consolas, 'Courier New', monospace",
    fontSize: 13
  },
  exportFormatTemplate: "[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}"
};

async function readProfiles(): Promise<ServerProfile[]> {
  try {
    const file = await readFile(profilesPath(), "utf8");
    return JSON.parse(file) as ServerProfile[];
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: ServerProfile[]) {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(profilesPath(), JSON.stringify(profiles, null, 2), "utf8");
}

function configSourceLabel(source: number | string) {
  const labels: Record<number, string> = {
    0: "unknown",
    1: "topic",
    2: "dynamic broker",
    3: "dynamic default broker",
    4: "static broker",
    5: "default",
    6: "dynamic broker logger"
  };
  return typeof source === "number" ? labels[source] ?? String(source) : source;
}

async function readPreferences(): Promise<AppPreferences> {
  try {
    const file = await readFile(preferencesPath(), "utf8");
    return { ...defaultPreferences, ...(JSON.parse(file) as Partial<AppPreferences>) };
  } catch {
    return defaultPreferences;
  }
}

async function writePreferences(preferences: AppPreferences) {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(preferencesPath(), JSON.stringify(preferences, null, 2), "utf8");
}

function normalizePreferences(preferences?: Partial<AppPreferences>): AppPreferences {
  return {
    favoriteTopicsByServer: preferences?.favoriteTopicsByServer ?? {},
    consumeDefaultsByServer: preferences?.consumeDefaultsByServer ?? {},
    manualAvroSchemasByServer: preferences?.manualAvroSchemasByServer ?? {},
    layout: preferences?.layout ?? {},
    appearance: preferences?.appearance ?? defaultPreferences.appearance,
    exportFormatTemplate: preferences?.exportFormatTemplate ?? defaultPreferences.exportFormatTemplate,
    windowBounds: preferences?.windowBounds
  };
}

function mergePreferences(current: AppPreferences, next: AppPreferences): AppPreferences {
  return {
    ...current,
    ...next,
    favoriteTopicsByServer: next.favoriteTopicsByServer ?? current.favoriteTopicsByServer,
    consumeDefaultsByServer: next.consumeDefaultsByServer ?? current.consumeDefaultsByServer,
    manualAvroSchemasByServer: next.manualAvroSchemasByServer ?? current.manualAvroSchemasByServer,
    layout: {
      ...(current.layout ?? {}),
      ...(next.layout ?? {})
    },
    appearance: {
      ...(current.appearance ?? {}),
      ...(next.appearance ?? {})
    },
    windowBounds: next.windowBounds ?? current.windowBounds
  };
}

function normalizeImportedServers(servers: unknown): ServerProfile[] {
  if (!Array.isArray(servers)) {
    throw new Error("설정 파일에 servers 배열이 없습니다.");
  }
  return servers.map((server) => {
    const item = server as Partial<ServerProfile>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const brokers = Array.isArray(item.brokers)
      ? item.brokers.map((broker) => String(broker).trim()).filter(Boolean)
      : [];
    if (!name || brokers.length === 0) {
      throw new Error("서버 설정 파일에 잘못된 서버 항목이 있습니다.");
    }
    return {
      id: typeof item.id === "string" && item.id.trim() ? item.id : randomUUID(),
      name,
      brokers,
      security: item.security,
      schemaRegistry: item.schemaRegistry
    };
  });
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
  await stopActiveConsumer();
  return { servers, preferences };
}

function createApplicationMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Import Settings...",
          accelerator: "CmdOrCtrl+O",
          click: async () => {
            if (!mainWindow) return;
            const confirm = await dialog.showMessageBox(mainWindow, {
              type: "question",
              buttons: ["Import", "Cancel"],
              defaultId: 0,
              cancelId: 1,
              title: "Import Settings",
              message: "현재 서버 목록과 개인 설정을 가져온 파일로 교체할까요?"
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
          label: "Export Settings...",
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
          label: "Preferences...",
          accelerator: "CmdOrCtrl+,",
          click: () => {
            mainWindow?.webContents.send("preferences:open", "general");
          }
        },
        {
          label: "Avro Schemas...",
          click: () => {
            mainWindow?.webContents.send("preferences:open", "avro");
          }
        },
        { type: "separator" },
        {
          label: "Check for Updates...",
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
        process.platform === "darwin" ? { role: "close" } : { role: "quit" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function getProfile(serverId: string) {
  const profiles = await readProfiles();
  const profile = profiles.find((item) => item.id === serverId);
  if (!profile) {
    throw new Error("등록된 서버를 찾을 수 없습니다.");
  }
  return profile;
}

function createKafka(profile: ServerProfile) {
  const sasl = profile.security?.sasl;
  return new Kafka({
    clientId: "kafka-tool",
    brokers: profile.brokers,
    ssl: profile.security?.ssl,
    sasl: sasl?.mechanism === "oauthbearer"
      ? {
        mechanism: "oauthbearer",
        oauthBearerProvider: async () => ({
          value: await requestOAuthBearerToken(sasl)
        })
      }
      : undefined,
    logLevel: logLevel.NOTHING
  });
}

async function requestOAuthBearerToken(config: NonNullable<NonNullable<ServerProfile["security"]>["sasl"]>) {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret
  });
  if (config.scope?.trim()) {
    body.set("scope", config.scope.trim());
  }
  if (config.audience?.trim()) {
    body.set("audience", config.audience.trim());
  }

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body
  });
  const payload = await response.json().catch(() => ({})) as { access_token?: unknown; error?: unknown; error_description?: unknown };
  if (!response.ok || typeof payload.access_token !== "string") {
    const detail = [payload.error, payload.error_description].filter(Boolean).join(": ");
    throw new Error(`OAuth token request failed (${response.status}). ${detail || response.statusText}`);
  }
  return payload.access_token;
}

async function withAdmin<T>(serverId: string, action: (admin: Admin) => Promise<T>) {
  const profile = await getProfile(serverId);
  const admin = createKafka(profile).admin();
  await admin.connect();
  try {
    return await action(admin);
  } finally {
    await admin.disconnect();
  }
}

function consumeKey(serverId: string, topic: string, consumerId = "default") {
  return `${serverId}:${topic}:${consumerId}`;
}

function shortHash(value: string) {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function kafkaToolConsumerGroupId(kind: "offset" | "time" | "live", parts: Array<string | number | undefined>) {
  return `kafka-tool-${kind}-${shortHash(parts.map((part) => String(part ?? "")).join(":"))}`;
}

async function shutdownConsumer(consumer: Consumer) {
  try {
    await consumer.stop();
  } catch {
    // Consumer may not be running yet.
  }
  try {
    await consumer.disconnect();
  } catch {
    // Nothing else to do during shutdown.
  }
}

function calculateLag(currentOffset: string, endOffset: string) {
  if (currentOffset === "-1" || !/^\d+$/.test(currentOffset) || !/^\d+$/.test(endOffset)) {
    return "-";
  }
  const lag = BigInt(endOffset) - BigInt(currentOffset);
  return lag < 0n ? "0" : lag.toString();
}

function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 80) || "messages";
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

function csvValue(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function formatMessagesCsv(messages: ConsumedMessage[]) {
  const header = ["topic", "partition", "offset", "timestamp", "key", "value", "headers"];
  const rows = messages.map((message) => [
    message.topic,
    message.partition,
    message.offset,
    message.timestamp,
    message.key,
    message.value,
    JSON.stringify(message.headers)
  ].map(csvValue).join(","));
  return [header.join(","), ...rows].join("\n");
}

function formatMessageLog(messages: ConsumedMessage[], template?: string) {
  const lineTemplate = template?.trim() || defaultPreferences.exportFormatTemplate || "{timestamp} {topic}[{partition}]@{offset} {key} {value}";
  return messages.map((message) => {
    const values: Record<string, string> = {
      topic: message.topic,
      partition: String(message.partition),
      offset: message.offset,
      timestamp: message.timestamp,
      key: message.key,
      value: message.value,
      headers: JSON.stringify(message.headers)
    };
    return lineTemplate.replace(/\{(topic|partition|offset|timestamp|key|value|headers)\}/g, (_match, key: string) => values[key] ?? "");
  }).join("\n");
}

function formatMessageLogLine(message: ConsumedMessage, template?: string) {
  return formatMessageLog([message], template);
}

function nextOffset(offset: string) {
  return (/^\d+$/.test(offset) ? BigInt(offset) + 1n : 0n).toString();
}

async function consumeOffsetBatch(request: ConsumeOffsetRequest): Promise<ConsumeOffsetResult> {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const consumer = kafka.consumer({
    groupId: kafkaToolConsumerGroupId("offset", [request.serverId, request.topic, request.partition])
  });
  const messages: ConsumedMessage[] = [];
  const limit = Math.max(1, Number(request.limit) || 10);
  let seekOffset = request.offset;
  let endExclusive: bigint | null = null;
  let settled = false;

  const admin = kafka.admin();
  await admin.connect();
  try {
    const offsets = await admin.fetchTopicOffsets(request.topic);
    const partitionOffset = offsets.find((offset) => offset.partition === request.partition);
    if (partitionOffset && /^\d+$/.test(partitionOffset.high) && /^\d+$/.test(partitionOffset.low)) {
      const high = BigInt(partitionOffset.high);
      const low = BigInt(partitionOffset.low);
      if (request.order === "desc") {
        const snapshotEnd = request.endOffsetExclusive && /^\d+$/.test(request.endOffsetExclusive)
          ? (BigInt(request.endOffsetExclusive) < high ? BigInt(request.endOffsetExclusive) : high)
          : high;
        const requestedEnd = /^\d+$/.test(request.offset) ? BigInt(request.offset) : 0n;
        endExclusive = requestedEnd > low ? (requestedEnd < snapshotEnd ? requestedEnd : snapshotEnd) : snapshotEnd;
      } else {
        endExclusive = request.endOffsetExclusive && /^\d+$/.test(request.endOffsetExclusive)
          ? (BigInt(request.endOffsetExclusive) < high ? BigInt(request.endOffsetExclusive) : high)
          : high;
      }

      if (request.order === "desc" && endExclusive !== null) {
        const start = endExclusive > BigInt(limit) ? endExclusive - BigInt(limit) : low;
        seekOffset = (start > low ? start : low).toString();
      } else if (/^\d+$/.test(seekOffset) && BigInt(seekOffset) < low) {
        seekOffset = low.toString();
      }
    }
  } finally {
    await admin.disconnect();
  }

  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<ConsumeOffsetResult>((resolve, reject) => {
    const cleanup = () => {
      void shutdownConsumer(consumer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({ messages: [...messages], endOffsetExclusive: endExclusive?.toString() });
      cleanup();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
      cleanup();
    };

    const timeout = setTimeout(finish, Math.max(8000, Math.min(120000, limit * 10)));

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (partition !== request.partition) {
          return;
        }
        if (endExclusive !== null && /^\d+$/.test(message.offset) && BigInt(message.offset) >= endExclusive) {
          finish();
          return;
        }
        messages.push(await toConsumedMessage(profile, topic, partition, message, manualSchema));
        if (messages.length >= limit) {
          finish();
        }
      }
    }).catch(fail);

    setTimeout(() => {
      try {
        consumer.seek({ topic: request.topic, partition: request.partition, offset: seekOffset });
      } catch (error) {
        fail(error);
      }
    }, 0);
  });
}

async function stopActiveConsumer(request?: StopConsumeRequest) {
  if (request?.serverId && request.topic) {
    const consumerId = request.consumerId;
    const targets = consumerId
      ? [consumeKey(request.serverId, request.topic, consumerId)]
      : [...activeConsumers.keys()].filter((key) => key.startsWith(`${request.serverId}:${request.topic}:`));
    const consumers = targets
      .map((key) => {
        const consumer = activeConsumers.get(key);
        activeConsumers.delete(key);
        return consumer;
      })
      .filter((consumer): consumer is Consumer => Boolean(consumer));
    await Promise.all(consumers.map(shutdownConsumer));
    return;
  }

  const consumers = [...activeConsumers.values()];
  activeConsumers.clear();
  await Promise.all(consumers.map(shutdownConsumer));
}

function sendConsumeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  mainWindow?.webContents.send("kafka:consume-error", message);
}

function sendUpdateStatus(status: UpdateStatus) {
  mainWindow?.webContents.send("updates:status", status);
}

function configureAutoUpdater() {
  if (autoUpdaterConfigured) return;
  autoUpdaterConfigured = true;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    sendUpdateStatus({ status: "checking", message: "업데이트 확인 중" });
  });

  autoUpdater.on("update-available", (info) => {
    sendUpdateStatus({
      status: "available",
      message: `새 버전 ${info.version} 다운로드 중`,
      version: info.version
    });
  });

  autoUpdater.on("update-not-available", (info) => {
    sendUpdateStatus({
      status: "not-available",
      message: `현재 최신 버전입니다. (${info.version})`,
      version: info.version
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent);
    sendUpdateStatus({
      status: "download-progress",
      message: `업데이트 다운로드 중 ${percent}%`,
      percent
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    sendUpdateStatus({
      status: "downloaded",
      message: `업데이트 ${info.version} 다운로드 완료`,
      version: info.version
    });
    if (!mainWindow) return;
    void dialog.showMessageBox(mainWindow, {
      type: "info",
      buttons: ["재시작 후 업데이트", "나중에"],
      defaultId: 0,
      cancelId: 1,
      title: "업데이트 준비 완료",
      message: `Kafka Tool ${info.version} 업데이트를 설치할 준비가 됐습니다.`,
      detail: "지금 재시작하면 업데이트가 적용됩니다."
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  autoUpdater.on("error", (error) => {
    sendUpdateStatus({
      status: "error",
      message: error instanceof Error ? error.message : String(error)
    });
  });
}

async function checkForUpdates() {
  configureAutoUpdater();
  if (!app.isPackaged) {
    sendUpdateStatus({
      status: "error",
      message: "업데이트 확인은 패키징된 앱에서만 동작합니다."
    });
    return;
  }
  await autoUpdater.checkForUpdates();
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

ipcMain.handle("servers:list", async () => readProfiles());

ipcMain.handle("servers:save", async (_event, server: Omit<ServerProfile, "id"> & { id?: string }) => {
  const brokers = server.brokers.map((broker) => broker.trim()).filter(Boolean);
  if (!server.name.trim()) {
    throw new Error("서버 이름을 입력하세요.");
  }
  if (brokers.length === 0) {
    throw new Error("브로커 주소를 하나 이상 입력하세요.");
  }

  if (server.security?.sasl) {
    const sasl = server.security.sasl;
    if (!sasl.tokenEndpoint.trim() || !sasl.clientId.trim() || !sasl.clientSecret.trim()) {
      throw new Error("SASL/OAUTHBEARER requires token endpoint, client ID, and client secret.");
    }
  }
  if (server.schemaRegistry?.url && !/^https?:\/\//i.test(server.schemaRegistry.url.trim())) {
    throw new Error("Schema Registry URL must start with http:// or https://.");
  }

  const profiles = await readProfiles();
  const nextProfile: ServerProfile = {
    id: server.id ?? randomUUID(),
    name: server.name.trim(),
    brokers,
    security: server.security,
    schemaRegistry: server.schemaRegistry?.url?.trim()
      ? {
        url: server.schemaRegistry.url.trim(),
        auth: server.schemaRegistry.auth?.type === "basic"
          ? {
            type: "basic",
            username: server.schemaRegistry.auth.username ?? "",
            password: server.schemaRegistry.auth.password ?? ""
          }
          : server.schemaRegistry.auth?.type === "bearer"
            ? {
              type: "bearer",
              token: server.schemaRegistry.auth.token ?? ""
            }
            : undefined
      }
      : undefined
  };
  const nextProfiles = profiles.some((item) => item.id === nextProfile.id)
    ? profiles.map((item) => (item.id === nextProfile.id ? nextProfile : item))
    : [...profiles, nextProfile];
  await writeProfiles(nextProfiles);
  return nextProfiles;
});

ipcMain.handle("servers:delete", async (_event, id: string) => {
  const profiles = await readProfiles();
  const nextProfiles = profiles.filter((item) => item.id !== id);
  await writeProfiles(nextProfiles);
  return nextProfiles;
});

ipcMain.handle("servers:reorder", async (_event, ids: string[]) => {
  const profiles = await readProfiles();
  const byId = new Map(profiles.map((profile) => [profile.id, profile]));
  const ordered = ids.map((id) => byId.get(id)).filter((profile): profile is ServerProfile => Boolean(profile));
  const missing = profiles.filter((profile) => !ids.includes(profile.id));
  const nextProfiles = [...ordered, ...missing];
  await writeProfiles(nextProfiles);
  return nextProfiles;
});

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
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle("preferences:load", async () => readPreferences());

ipcMain.handle("preferences:save", async (_event, preferences: AppPreferences) => {
  const mergedPreferences = mergePreferences(await readPreferences(), preferences);
  await writePreferences(mergedPreferences);
  return mergedPreferences;
});

ipcMain.handle("kafka:health", async (_event, serverId: string): Promise<void> => {
  await withAdmin(serverId, async (admin) => {
    await admin.describeCluster();
  });
});

ipcMain.handle("kafka:topics", async (_event, serverId: string): Promise<TopicSummary[]> => {
  return withAdmin(serverId, async (admin) => {
    const metadata = await admin.fetchTopicMetadata();
    return metadata.topics
      .filter((topic) => !topic.name.startsWith("__"))
      .map((topic) => ({
        name: topic.name,
        partitions: topic.partitions.length,
        replicationFactor: topic.partitions[0]?.replicas.length ?? 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });
});

ipcMain.handle("kafka:topic-message-counts", async (_event, serverId: string, topicNames: string[]): Promise<TopicMessageCounts> => {
  const uniqueTopicNames = [...new Set(topicNames.map((topic) => topic.trim()).filter(Boolean))];
  if (uniqueTopicNames.length === 0) return {};
  return withAdmin(serverId, async (admin) => {
    const entries = await mapWithConcurrency(uniqueTopicNames, 6, async (topicName) => {
      try {
        const offsets = await admin.fetchTopicOffsets(topicName);
        const messageCount = offsets.reduce((total, offset) => {
          const high = /^\d+$/.test(offset.high) ? BigInt(offset.high) : 0n;
          const low = /^\d+$/.test(offset.low) ? BigInt(offset.low) : 0n;
          return total + (high > low ? high - low : 0n);
        }, 0n);
        return [topicName, messageCount.toString()] as const;
      } catch {
        return [topicName, "0"] as const;
      }
    });
    return Object.fromEntries(entries);
  });
});

async function loadBrokerSummaries(admin: Admin): Promise<BrokerSummary[]> {
  const [cluster, metadata] = await Promise.all([
    admin.describeCluster(),
    admin.fetchTopicMetadata()
  ]);
  const brokerStats = new Map<number, BrokerSummary>();
  for (const broker of cluster.brokers) {
    brokerStats.set(broker.nodeId, {
      nodeId: broker.nodeId,
      host: broker.host,
      port: broker.port,
      controller: broker.nodeId === cluster.controller,
      leaderCount: 0,
      replicaCount: 0,
      inSyncReplicaCount: 0,
      outOfSyncReplicaCount: 0,
      onlinePartitionCount: 0,
      underReplicatedPartitionCount: 0,
      leaderSkewPercent: 0,
      partitionSkewPercent: 0
    });
  }

  let totalLeaders = 0;
  let totalReplicas = 0;
  for (const topic of metadata.topics.filter((item) => !item.name.startsWith("__"))) {
    for (const partition of topic.partitions) {
      const leader = brokerStats.get(partition.leader);
      if (leader) {
        leader.leaderCount += 1;
        leader.onlinePartitionCount += 1;
        totalLeaders += 1;
        if (partition.isr.length < partition.replicas.length) {
          leader.underReplicatedPartitionCount += 1;
        }
      }

      for (const replicaId of partition.replicas) {
        const replica = brokerStats.get(replicaId);
        if (!replica) continue;
        replica.replicaCount += 1;
        totalReplicas += 1;
        if (partition.isr.includes(replicaId)) {
          replica.inSyncReplicaCount += 1;
        } else {
          replica.outOfSyncReplicaCount += 1;
        }
      }
    }
  }

  const averageLeaders = brokerStats.size > 0 ? totalLeaders / brokerStats.size : 0;
  const averageReplicas = brokerStats.size > 0 ? totalReplicas / brokerStats.size : 0;
  return [...brokerStats.values()]
    .map((broker) => ({
      ...broker,
      leaderSkewPercent: averageLeaders > 0 ? ((broker.leaderCount - averageLeaders) / averageLeaders) * 100 : 0,
      partitionSkewPercent: averageReplicas > 0 ? ((broker.replicaCount - averageReplicas) / averageReplicas) * 100 : 0
    }))
    .sort((left, right) => left.nodeId - right.nodeId);
}

async function loadBrokerDetail(admin: Admin, brokerId: number): Promise<BrokerDetail> {
  const brokers = await loadBrokerSummaries(admin);
  const broker = brokers.find((item) => item.nodeId === brokerId);
  if (!broker) {
    throw new Error("브로커를 찾을 수 없습니다.");
  }
  const configsResponse = await admin.describeConfigs({
    resources: [{ type: ConfigResourceTypes.BROKER, name: String(brokerId) }],
    includeSynonyms: true
  });
  const configResource = configsResponse.resources[0];
  const configs: BrokerConfigEntry[] = (configResource?.configEntries ?? [])
    .map((entry) => ({
      name: entry.configName,
      value: entry.isSensitive ? "" : entry.configValue ?? "",
      source: configSourceLabel(entry.configSource),
      isDefault: entry.isDefault,
      isSensitive: entry.isSensitive,
      readOnly: entry.readOnly,
      synonyms: (entry.configSynonyms ?? []).map((synonym) => ({
        name: synonym.configName,
        value: entry.isSensitive ? "" : synonym.configValue ?? "",
        source: configSourceLabel(synonym.configSource)
      }))
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    broker,
    configs,
    logDirectories: [],
    logDirectoriesSupported: false
  };
}

ipcMain.handle("kafka:brokers", async (_event, serverId: string): Promise<BrokerSummary[]> => {
  return withAdmin(serverId, loadBrokerSummaries);
});

ipcMain.handle("kafka:broker-detail", async (_event, serverId: string, brokerId: number): Promise<BrokerDetail> => {
  return withAdmin(serverId, (admin) => loadBrokerDetail(admin, brokerId));
});

ipcMain.handle("kafka:broker-config-update", async (_event, request: BrokerConfigUpdateRequest): Promise<BrokerDetail> => {
  return withAdmin(request.serverId, async (admin) => {
    await admin.alterConfigs({
      validateOnly: Boolean(request.validateOnly),
      resources: [{
        type: ConfigResourceTypes.BROKER,
        name: String(request.brokerId),
        configEntries: [{ name: request.name, value: request.value }]
      }]
    });
    return loadBrokerDetail(admin, request.brokerId);
  });
});

ipcMain.handle("kafka:topic-detail", async (_event, serverId: string, topicName: string): Promise<TopicDetail> => {
  return withAdmin(serverId, async (admin) => {
    const metadata = await admin.fetchTopicMetadata({ topics: [topicName] });
    const topic = metadata.topics[0];
    if (!topic) {
      throw new Error("토픽을 찾을 수 없습니다.");
    }
    const offsets = await admin.fetchTopicOffsets(topicName);
    return {
      name: topic.name,
      partitions: topic.partitions.map((partition) => ({
        partition: partition.partitionId,
        leader: partition.leader,
        replicas: partition.replicas,
        isr: partition.isr
      })),
      offsets: offsets.map((offset) => ({
        partition: offset.partition,
        low: offset.low,
        high: offset.high
      }))
    };
  });
});

async function loadTopicConfigs(admin: Admin, topicName: string): Promise<TopicConfigEntry[]> {
  const configsResponse = await admin.describeConfigs({
    resources: [{ type: ConfigResourceTypes.TOPIC, name: topicName }],
    includeSynonyms: true
  });
  const configResource = configsResponse.resources[0];
  if (!configResource) return [];
  if (configResource.errorMessage) {
    throw new Error(configResource.errorMessage);
  }
  return (configResource.configEntries ?? [])
    .map((entry) => ({
      name: entry.configName,
      value: entry.isSensitive ? "" : entry.configValue ?? "",
      source: configSourceLabel(entry.configSource),
      isDefault: entry.isDefault,
      isSensitive: entry.isSensitive,
      readOnly: entry.readOnly,
      synonyms: (entry.configSynonyms ?? []).map((synonym) => ({
        name: synonym.configName,
        value: entry.isSensitive ? "" : synonym.configValue ?? "",
        source: configSourceLabel(synonym.configSource)
      }))
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

ipcMain.handle("kafka:topic-configs", async (_event, serverId: string, topicName: string): Promise<TopicConfigEntry[]> => {
  return withAdmin(serverId, (admin) => loadTopicConfigs(admin, topicName));
});

ipcMain.handle("kafka:topic-config-update", async (_event, request: TopicConfigUpdateRequest): Promise<TopicConfigEntry[]> => {
  const entries = request.entries
    .map((entry) => ({ name: entry.name.trim(), value: entry.value }))
    .filter((entry) => entry.name);
  if (entries.length === 0) {
    throw new Error("변경할 토픽 설정이 없습니다.");
  }
  return withAdmin(request.serverId, async (admin) => {
    await admin.alterConfigs({
      validateOnly: Boolean(request.validateOnly),
      resources: [{
        type: ConfigResourceTypes.TOPIC,
        name: request.topic,
        configEntries: entries
      }]
    });
    return loadTopicConfigs(admin, request.topic);
  });
});

ipcMain.handle("kafka:topics-delete", async (_event, request: TopicMutationRequest): Promise<void> => {
  const topics = request.topics.map((topic) => topic.trim()).filter(Boolean);
  if (topics.length === 0) {
    throw new Error("No topics selected.");
  }
  await withAdmin(request.serverId, async (admin) => {
    await admin.deleteTopics({ topics, timeout: 15000 });
  });
});

ipcMain.handle("kafka:topics-purge", async (_event, request: TopicMutationRequest): Promise<void> => {
  const topics = request.topics.map((topic) => topic.trim()).filter(Boolean);
  if (topics.length === 0) {
    throw new Error("No topics selected.");
  }
  await withAdmin(request.serverId, async (admin) => {
    for (const topic of topics) {
      const offsets = await admin.fetchTopicOffsets(topic);
      await admin.deleteTopicRecords({
        topic,
        partitions: offsets.map((offset) => ({
          partition: offset.partition,
          offset: offset.high
        }))
      });
    }
  });
});

ipcMain.handle("kafka:groups", async (_event, serverId: string): Promise<ConsumerGroupSummary[]> => {
  return withAdmin(serverId, async (admin) => {
    const groups = await admin.listGroups();
    const groupIds = groups.groups.map((group) => group.groupId);
    const describedGroups = groupIds.length > 0
      ? await admin.describeGroups(groupIds).catch(() => ({ groups: [] }))
      : { groups: [] };
    const describedById = new Map(describedGroups.groups.map((group) => [group.groupId, group]));
    const endOffsetsByTopic = new Map<string, Map<number, string>>();

    async function getEndOffsets(topic: string) {
      const cached = endOffsetsByTopic.get(topic);
      if (cached) return cached;
      const offsets = await admin.fetchTopicOffsets(topic);
      const mapped = new Map(offsets.map((offset) => [offset.partition, offset.high]));
      endOffsetsByTopic.set(topic, mapped);
      return mapped;
    }

    const summaries = await Promise.all(groups.groups.map(async (group) => {
        const described = describedById.get(group.groupId);
        const summary: ConsumerGroupSummary = {
          groupId: group.groupId,
          protocol: described?.protocolType ?? group.protocolType,
          state: described?.state,
          members: described?.members.length
        };

        try {
          const groupOffsets = await admin.fetchOffsets({ groupId: group.groupId });
          const topicNames = [...new Set(groupOffsets.map((topicOffset) => topicOffset.topic))];
          const topicEndOffsets = new Map<string, Map<number, string>>();

          await Promise.all(topicNames.map(async (topic) => {
            topicEndOffsets.set(topic, await getEndOffsets(topic));
          }));

          let assignedPartitions = 0;
          const totalLag = groupOffsets.reduce<bigint | null>((total, topicOffset) => {
            assignedPartitions += topicOffset.partitions.length;
            return topicOffset.partitions.reduce<bigint | null>((partitionTotal, partitionOffset) => {
              const endOffset = topicEndOffsets.get(topicOffset.topic)?.get(partitionOffset.partition) ?? "-";
              const lag = calculateLag(partitionOffset.offset, endOffset);
              if (!/^\d+$/.test(lag)) return partitionTotal;
              return (partitionTotal ?? 0n) + BigInt(lag);
            }, total);
          }, null);

          return {
            ...summary,
            topics: topicNames.length,
            assignedPartitions,
            totalLag: totalLag?.toString() ?? "-"
          };
        } catch {
          return summary;
        }
      }));

    return summaries
      .map((summary) => {
        const described = describedById.get(summary.groupId);
        return {
          ...summary,
          protocol: summary.protocol ?? described?.protocolType,
          state: summary.state ?? described?.state,
          members: summary.members ?? described?.members.length
        };
      })
      .sort((a, b) => a.groupId.localeCompare(b.groupId));
  });
});

ipcMain.handle("kafka:groups-delete", async (_event, request: ConsumerGroupMutationRequest): Promise<void> => {
  const groupIds = request.groupIds.map((groupId) => groupId.trim()).filter(Boolean);
  if (groupIds.length === 0) {
    throw new Error("No consumer groups selected.");
  }
  await withAdmin(request.serverId, async (admin) => {
    await admin.deleteGroups(groupIds);
  });
});

ipcMain.handle("kafka:group-lag", async (_event, serverId: string, groupId: string): Promise<ConsumerGroupLagDetail> => {
  return withAdmin(serverId, async (admin) => {
    const [groupOffsets, describedGroups] = await Promise.all([
      admin.fetchOffsets({ groupId }),
      admin.describeGroups([groupId]).catch(() => ({ groups: [] }))
    ]);
    const describedGroup = describedGroups.groups[0];
    const topicNames = [...new Set(groupOffsets.map((topicOffset) => topicOffset.topic))];
    const endOffsetsByTopic = new Map<string, Map<number, string>>();

    await Promise.all(topicNames.map(async (topic) => {
      const offsets = await admin.fetchTopicOffsets(topic);
      endOffsetsByTopic.set(
        topic,
        new Map(offsets.map((offset) => [offset.partition, offset.high]))
      );
    }));

    const rows = groupOffsets.flatMap((topicOffset) =>
      topicOffset.partitions.map((partitionOffset) => {
        const endOffset = endOffsetsByTopic.get(topicOffset.topic)?.get(partitionOffset.partition) ?? "-";
        const currentOffset = partitionOffset.offset;
        return {
          topic: topicOffset.topic,
          partition: partitionOffset.partition,
          currentOffset: currentOffset === "-1" ? "-" : currentOffset,
          endOffset,
          lag: calculateLag(currentOffset, endOffset),
          metadata: partitionOffset.metadata ?? undefined
        };
      })
    ).sort((left, right) => (
      left.topic.localeCompare(right.topic) || left.partition - right.partition
    ));

    const totalLag = rows.reduce<bigint | null>((total, row) => {
      if (!/^\d+$/.test(row.lag)) return total;
      return (total ?? 0n) + BigInt(row.lag);
    }, null);

    return {
      groupId,
      state: describedGroup?.state,
      protocol: describedGroup?.protocolType,
      members: describedGroup?.members.length ?? 0,
      totalLag: totalLag?.toString() ?? "-",
      rows
    };
  });
});

ipcMain.handle("messages:export", async (_event, request: MessageExportRequest): Promise<string | null> => {
  if (!mainWindow) return null;
  const extension = request.format === "csv" ? "csv" : request.format === "log" ? "log" : "json";
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export consumed messages",
    defaultPath: `${sanitizeFileName(request.topic)}-${new Date().toISOString().slice(0, 10)}.${extension}`,
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  const content = request.format === "csv"
    ? formatMessagesCsv(request.messages)
    : request.format === "log"
      ? formatMessageLog(request.messages, request.template)
      : JSON.stringify({
      exportedAt: new Date().toISOString(),
      topic: request.topic,
      count: request.messages.length,
      messages: request.messages
    }, null, 2);
  await writeFile(result.filePath, content, "utf8");
  return result.filePath;
});

ipcMain.handle("messages:export-offset", async (_event, request: OffsetMessageExportRequest): Promise<string | null> => {
  if (!mainWindow) return null;
  const extension = request.format === "csv" ? "csv" : request.format === "log" ? "log" : "json";
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export offset range messages",
    defaultPath: `${sanitizeFileName(request.topic)}-offset-${new Date().toISOString().slice(0, 10)}.${extension}`,
    filters: [{ name: extension.toUpperCase(), extensions: [extension] }]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }

  const stream = createWriteStream(result.filePath, { encoding: "utf8" });
  const write = (chunk: string) => new Promise<void>((resolve, reject) => {
    stream.write(chunk, (error) => error ? reject(error) : resolve());
  });
  const totalLimit = Math.max(1, Number(request.limit) || 10);
  const pageSize = 5000;
  let remaining = totalLimit;
  let cursor = request.offset;
  let count = 0;
  let jsonFirst = true;

  try {
    if (request.format === "csv") {
      await write(["topic", "partition", "offset", "timestamp", "key", "value", "headers"].join(",") + "\n");
    } else if (request.format === "json") {
      await write(`{\n  "exportedAt": ${JSON.stringify(new Date().toISOString())},\n  "topic": ${JSON.stringify(request.topic)},\n  "messages": [\n`);
    }

    while (remaining > 0) {
      const batchLimit = Math.min(pageSize, remaining);
      const batch = await consumeOffsetBatch({ ...request, offset: cursor, limit: batchLimit });
      const messages = request.order === "desc" ? [...batch.messages].reverse() : batch.messages;
      if (messages.length === 0) break;

      for (const message of messages) {
        if (request.format === "csv") {
          await write([
            message.topic,
            message.partition,
            message.offset,
            message.timestamp,
            message.key,
            message.value,
            JSON.stringify(message.headers)
          ].map(csvValue).join(",") + "\n");
        } else if (request.format === "log") {
          await write(formatMessageLogLine(message, request.template) + "\n");
        } else {
          await write(`${jsonFirst ? "" : ",\n"}    ${JSON.stringify(message)}`);
          jsonFirst = false;
        }
      }

      count += messages.length;
      remaining -= messages.length;
      if (messages.length < batchLimit) break;
      cursor = request.order === "desc"
        ? messages[messages.length - 1].offset
        : nextOffset(messages[messages.length - 1].offset);
    }

    if (request.format === "json") {
      await write(`\n  ],\n  "count": ${count}\n}\n`);
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      stream.end((error?: Error | null) => error ? reject(error) : resolve());
    });
  }

  return result.filePath;
});

ipcMain.handle("kafka:produce", async (_event, request: ProduceRequest): Promise<ProducedMessage[]> => {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const producer = createKafka(profile).producer();
  await producer.connect();
  try {
    const value = encodeManualAvro(profile, request.topic, request.value, manualSchema);
    const result = await producer.send({
      topic: request.topic,
      messages: [
        {
          key: request.key || undefined,
          value,
          headers: request.headers
        }
      ]
    });
    return result.map((item) => ({
      topic: request.topic,
      partition: item.partition,
      offset: item.baseOffset
    }));
  } finally {
    await producer.disconnect();
  }
});

ipcMain.handle("kafka:consume-offset", async (_event, request: ConsumeOffsetRequest): Promise<ConsumeOffsetResult> => {
  return consumeOffsetBatch(request);
});

ipcMain.handle("kafka:consume-time-range", async (_event, request: ConsumeTimeRangeRequest): Promise<ConsumedMessage[]> => {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const limit = Math.max(1, Number(request.limit) || 100);
  const messages: ConsumedMessage[] = [];
  const admin = kafka.admin();
  const consumer = kafka.consumer({
    groupId: kafkaToolConsumerGroupId("time", [request.serverId, request.topic, request.partition ?? "all"])
  });
  let settled = false;

  await admin.connect();
  const metadata = await admin.fetchTopicMetadata({ topics: [request.topic] });
  const topic = metadata.topics[0];
  if (!topic) {
    await admin.disconnect();
    throw new Error("Topic not found.");
  }

  const partitions = topic.partitions
    .map((partition) => partition.partitionId)
    .filter((partition) => request.partition === undefined || partition === request.partition);
  const offsets = await admin.fetchTopicOffsetsByTimestamp(request.topic, request.startTimestamp);
  const startOffsets = new Map(offsets.map((offset) => [offset.partition, offset.offset]));
  await admin.disconnect();

  if (partitions.length === 0) {
    return [];
  }

  const completed = new Set<number>();
  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<ConsumedMessage[]>((resolve, reject) => {
    const cleanup = () => {
      void shutdownConsumer(consumer);
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve([...messages].sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)));
      cleanup();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
      cleanup();
    };

    const timeout = setTimeout(finish, 15000);

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (!partitions.includes(partition)) {
          return;
        }

        const timestamp = Number(message.timestamp);
        if (timestamp > request.endTimestamp) {
          completed.add(partition);
          if (completed.size >= partitions.length) {
            finish();
          }
          return;
        }

        if (timestamp >= request.startTimestamp) {
          messages.push(await toConsumedMessage(profile, topic, partition, message, manualSchema));
          if (messages.length >= limit) {
            finish();
          }
        }
      }
    }).catch(fail);

    setTimeout(() => {
      try {
        for (const partition of partitions) {
          consumer.seek({
            topic: request.topic,
            partition,
            offset: startOffsets.get(partition) ?? "0"
          });
        }
      } catch (error) {
        fail(error);
      }
    }, 0);
  });
});

ipcMain.handle("kafka:consume-stop", async (_event, request?: StopConsumeRequest) => {
  await stopActiveConsumer(request);
});

ipcMain.handle("kafka:consume-start", async (_event, request: StartConsumeRequest) => {
  const consumerId = request.consumerId ?? "default";
  await stopActiveConsumer({ serverId: request.serverId, topic: request.topic, consumerId });
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const kafka = createKafka(profile);
  const groupId = kafkaToolConsumerGroupId("live", [request.serverId, request.topic, consumerId]);
  const consumer = kafka.consumer({ groupId });
  const key = consumeKey(request.serverId, request.topic, consumerId);
  activeConsumers.set(key, consumer);

  try {
    await consumer.connect();
    await consumer.subscribe({ topic: request.topic, fromBeginning: request.fromBeginning });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (request.partition !== undefined && partition !== request.partition) {
          return;
        }
        const payload = {
          ...await toConsumedMessage(profile, topic, partition, message, manualSchema),
          consumerId
        };
        mainWindow?.webContents.send("kafka:consume-message", payload);
      }
    }).catch((error) => {
      activeConsumers.delete(key);
      void shutdownConsumer(consumer);
      sendConsumeError(error);
    });
  } catch (error) {
    activeConsumers.delete(key);
    await shutdownConsumer(consumer);
    sendConsumeError(error);
    throw error;
  }
});

if (process.platform === "win32") {
  app.setAppUserModelId(appUserModelId);
}

app.whenReady().then(createWindow);

app.on("before-quit", (event) => {
  if (isCleaningUpConsumers || activeConsumers.size === 0) {
    return;
  }
  event.preventDefault();
  isCleaningUpConsumers = true;
  void stopActiveConsumer()
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
  await stopActiveConsumer();
  process.exit(0);
}

process.on("SIGINT", () => {
  void cleanupConsumersAndExit();
});

process.on("SIGTERM", () => {
  void cleanupConsumersAndExit();
});
