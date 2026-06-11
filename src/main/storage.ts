import { app } from "electron";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppPreferences, ServerProfile } from "../shared/types.js";

export function appIconPath() {
  return path.join(app.getAppPath(), "build/icon.ico");
}

function profilesPath() {
  return path.join(app.getPath("userData"), "servers.json");
}

function preferencesPath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

export const defaultPreferences: AppPreferences = {
  favoriteTopicsByServer: {},
  consumeDefaultsByServer: {},
  manualAvroSchemasByServer: {},
  layout: {},
  appearance: {
    fontFamily: "Inter, 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
    language: "auto"
  },
  keyboardShortcuts: {},
  releaseNotes: {},
  exportFormatTemplate: "[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}"
};

export async function readProfiles(): Promise<ServerProfile[]> {
  try {
    const file = await readFile(profilesPath(), "utf8");
    return JSON.parse(file) as ServerProfile[];
  } catch {
    return [];
  }
}

export async function writeProfiles(profiles: ServerProfile[]) {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(profilesPath(), JSON.stringify(profiles, null, 2), "utf8");
}

export async function readPreferences(): Promise<AppPreferences> {
  try {
    const file = await readFile(preferencesPath(), "utf8");
    return { ...defaultPreferences, ...(JSON.parse(file) as Partial<AppPreferences>) };
  } catch {
    return defaultPreferences;
  }
}

export async function writePreferences(preferences: AppPreferences) {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(preferencesPath(), JSON.stringify(preferences, null, 2), "utf8");
}

export function normalizePreferences(preferences?: Partial<AppPreferences>): AppPreferences {
  return {
    favoriteTopicsByServer: preferences?.favoriteTopicsByServer ?? {},
    consumeDefaultsByServer: preferences?.consumeDefaultsByServer ?? {},
    manualAvroSchemasByServer: preferences?.manualAvroSchemasByServer ?? {},
    layout: preferences?.layout ?? {},
    appearance: preferences?.appearance ?? defaultPreferences.appearance,
    keyboardShortcuts: preferences?.keyboardShortcuts ?? {},
    releaseNotes: preferences?.releaseNotes ?? {},
    exportFormatTemplate: preferences?.exportFormatTemplate ?? defaultPreferences.exportFormatTemplate,
    windowBounds: preferences?.windowBounds
  };
}

export function mergePreferences(current: AppPreferences, next: AppPreferences): AppPreferences {
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
    keyboardShortcuts: {
      ...(current.keyboardShortcuts ?? {}),
      ...(next.keyboardShortcuts ?? {})
    },
    releaseNotes: {
      ...(current.releaseNotes ?? {}),
      ...(next.releaseNotes ?? {})
    },
    windowBounds: next.windowBounds ?? current.windowBounds
  };
}

export function normalizeImportedServers(servers: unknown): ServerProfile[] {
  if (!Array.isArray(servers)) {
    throw new Error("Settings file does not contain a servers array.");
  }
  return servers.map((server) => {
    const item = server as Partial<ServerProfile>;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const brokers = Array.isArray(item.brokers)
      ? item.brokers.map((broker) => String(broker).trim()).filter(Boolean)
      : [];
    if (!name || brokers.length === 0) {
      throw new Error("Server settings file contains an invalid server entry.");
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

export async function getProfile(serverId: string) {
  const profiles = await readProfiles();
  const profile = profiles.find((item) => item.id === serverId);
  if (!profile) {
    throw new Error("Registered server not found.");
  }
  return profile;
}
