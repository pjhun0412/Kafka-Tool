import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Kafka, logLevel, type Admin, type Consumer, type KafkaMessage } from "kafkajs";
import { autoUpdater } from "electron-updater";
import type {
  ConsumedMessage,
  ConsumeOffsetRequest,
  ConsumeTimeRangeRequest,
  AppPreferences,
  AppSettingsBundle,
  ConsumerGroupLagDetail,
  ConsumerGroupSummary,
  ImportSettingsResult,
  MessageExportRequest,
  ProduceRequest,
  ProducedMessage,
  ServerProfile,
  StartConsumeRequest,
  StopConsumeRequest,
  TopicDetail,
  TopicSummary,
  UpdateStatus
} from "../shared/types.js";

const devServerUrl = process.env.KAFKA_TOOL_DEV_SERVER_URL;
let mainWindow: BrowserWindow | null = null;
const activeConsumers = new Map<string, Consumer>();
let windowBoundsSaveTimer: NodeJS.Timeout | null = null;
let autoUpdaterConfigured = false;

function profilesPath() {
  return path.join(app.getPath("userData"), "servers.json");
}

function preferencesPath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

const defaultPreferences: AppPreferences = {
  favoriteTopicsByServer: {},
  consumeDefaultsByServer: {},
  layout: {}
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
    layout: preferences?.layout ?? {},
    windowBounds: preferences?.windowBounds
  };
}

function mergePreferences(current: AppPreferences, next: AppPreferences): AppPreferences {
  return {
    ...current,
    ...next,
    favoriteTopicsByServer: next.favoriteTopicsByServer ?? current.favoriteTopicsByServer,
    consumeDefaultsByServer: next.consumeDefaultsByServer ?? current.consumeDefaultsByServer,
    layout: {
      ...(current.layout ?? {}),
      ...(next.layout ?? {})
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
      security: item.security
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

function consumeKey(serverId: string, topic: string) {
  return `${serverId}:${topic}`;
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

async function stopActiveConsumer(request?: StopConsumeRequest) {
  if (request?.serverId && request.topic) {
    const key = consumeKey(request.serverId, request.topic);
    const consumer = activeConsumers.get(key);
    activeConsumers.delete(key);
    await consumer?.disconnect().catch(() => undefined);
    return;
  }

  const consumers = [...activeConsumers.values()];
  activeConsumers.clear();
  await Promise.all(consumers.map((consumer) => consumer.disconnect().catch(() => undefined)));
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
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const bounds = mainWindow.getNormalBounds();
  const preferences = await readPreferences();
  await writePreferences({
    ...preferences,
    windowBounds: {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      maximized: mainWindow.isMaximized()
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

  const profiles = await readProfiles();
  const nextProfile: ServerProfile = {
    id: server.id ?? randomUUID(),
    name: server.name.trim(),
    brokers,
    security: server.security
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

ipcMain.handle("kafka:topics", async (_event, serverId: string): Promise<TopicSummary[]> => {
  return withAdmin(serverId, async (admin) => {
    const metadata = await admin.fetchTopicMetadata();
    const topics = metadata.topics
      .filter((topic) => !topic.name.startsWith("__"))
      .map((topic) => ({
        name: topic.name,
        partitions: topic.partitions.length,
        replicationFactor: topic.partitions[0]?.replicas.length ?? 0
      }));
    const topicsWithOffsets = await mapWithConcurrency(topics, 8, async (topic) => {
      try {
        const offsets = await admin.fetchTopicOffsets(topic.name);
        const messageCount = offsets.reduce((total, offset) => {
          const high = /^\d+$/.test(offset.high) ? BigInt(offset.high) : 0n;
          const low = /^\d+$/.test(offset.low) ? BigInt(offset.low) : 0n;
          return total + (high > low ? high - low : 0n);
        }, 0n);
        return {
          ...topic,
          messageCount: messageCount.toString()
        };
      } catch {
        return topic;
      }
    });
    return topicsWithOffsets
      .sort((a, b) => a.name.localeCompare(b.name));
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

ipcMain.handle("kafka:groups", async (_event, serverId: string): Promise<ConsumerGroupSummary[]> => {
  return withAdmin(serverId, async (admin) => {
    const groups = await admin.listGroups();
    return groups.groups
      .map((group) => ({
        groupId: group.groupId,
        protocol: group.protocolType
      }))
      .sort((a, b) => a.groupId.localeCompare(b.groupId));
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
  const extension = request.format === "csv" ? "csv" : "json";
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
    : JSON.stringify({
      exportedAt: new Date().toISOString(),
      topic: request.topic,
      count: request.messages.length,
      messages: request.messages
    }, null, 2);
  await writeFile(result.filePath, content, "utf8");
  return result.filePath;
});

ipcMain.handle("kafka:produce", async (_event, request: ProduceRequest): Promise<ProducedMessage[]> => {
  const profile = await getProfile(request.serverId);
  const producer = createKafka(profile).producer();
  await producer.connect();
  try {
    const result = await producer.send({
      topic: request.topic,
      messages: [
        {
          key: request.key || undefined,
          value: request.value
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

function toConsumedMessage(serverId: string | undefined, topic: string, partition: number, message: KafkaMessage): ConsumedMessage {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(message.headers ?? {})) {
    if (Array.isArray(value)) {
      headers[key] = value.map((item) => (Buffer.isBuffer(item) ? item.toString("utf8") : String(item))).join(", ");
    } else if (value !== undefined) {
      headers[key] = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
    }
  }
  return {
    serverId,
    topic,
    partition,
    offset: message.offset,
    timestamp: new Date(Number(message.timestamp)).toISOString(),
    key: message.key?.toString("utf8") ?? "",
    value: message.value?.toString("utf8") ?? "",
    headers
  };
}

ipcMain.handle("kafka:consume-offset", async (_event, request: ConsumeOffsetRequest): Promise<ConsumedMessage[]> => {
  const profile = await getProfile(request.serverId);
  const consumer = createKafka(profile).consumer({ groupId: `kafka-tool-offset-${Date.now()}` });
  const messages: ConsumedMessage[] = [];
  const limit = Math.max(1, Math.min(Number(request.limit) || 10, 500));
  let settled = false;

  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: true });

  return await new Promise<ConsumedMessage[]>((resolve, reject) => {
    const cleanup = () => {
      void consumer.stop()
        .catch(() => undefined)
        .finally(() => {
          void consumer.disconnect().catch(() => undefined);
        });
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve([...messages]);
      cleanup();
    };

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
      cleanup();
    };

    const timeout = setTimeout(finish, 8000);

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (partition !== request.partition) {
          return;
        }
        messages.push(toConsumedMessage(request.serverId, topic, partition, message));
        if (messages.length >= limit) {
          finish();
        }
      }
    }).catch(fail);

    setTimeout(() => {
      try {
        consumer.seek({ topic: request.topic, partition: request.partition, offset: request.offset });
      } catch (error) {
        fail(error);
      }
    }, 0);
  });
});

ipcMain.handle("kafka:consume-time-range", async (_event, request: ConsumeTimeRangeRequest): Promise<ConsumedMessage[]> => {
  const profile = await getProfile(request.serverId);
  const kafka = createKafka(profile);
  const limit = Math.max(1, Math.min(Number(request.limit) || 100, 1000));
  const messages: ConsumedMessage[] = [];
  const admin = kafka.admin();
  const consumer = kafka.consumer({ groupId: `kafka-tool-time-${Date.now()}` });
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
      void consumer.stop()
        .catch(() => undefined)
        .finally(() => {
          void consumer.disconnect().catch(() => undefined);
        });
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
          messages.push(toConsumedMessage(request.serverId, topic, partition, message));
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
  await stopActiveConsumer({ serverId: request.serverId, topic: request.topic });
  const profile = await getProfile(request.serverId);
  const kafka = createKafka(profile);
  const groupId = `kafka-tool-${Date.now()}`;
  const consumer = kafka.consumer({ groupId });
  activeConsumers.set(consumeKey(request.serverId, request.topic), consumer);

  await consumer.connect();
  await consumer.subscribe({ topic: request.topic, fromBeginning: request.fromBeginning });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (request.partition !== undefined && partition !== request.partition) {
        return;
      }
      const payload = toConsumedMessage(request.serverId, topic, partition, message);
      mainWindow?.webContents.send("kafka:consume-message", payload);
    }
  }).catch((error) => {
    activeConsumers.delete(consumeKey(request.serverId, request.topic));
    sendConsumeError(error);
  });
});

app.whenReady().then(createWindow);

app.on("before-quit", () => {
  void stopActiveConsumer();
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
