import { app, safeStorage } from "electron";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AppPreferences, ServerProfile } from "../shared/types.js";

type StoredServerProfile = Omit<ServerProfile, "schemaRegistry" | "security"> & {
  schemaRegistry?: {
    url: string;
    auth?: (
      | {
          type: "basic";
          username?: string;
          password?: string;
          passwordEncrypted?: string;
        }
      | {
          type: "bearer";
          token?: string;
          tokenEncrypted?: string;
        }
    );
  };
  security?: {
    ssl?: boolean;
    sasl?: {
      mechanism: "oauthbearer";
      tokenEndpoint: string;
      clientId: string;
      clientSecret?: string;
      clientSecretEncrypted?: string;
      scope?: string;
      audience?: string;
    };
  };
};

export function appIconPath() {
  return path.join(app.getAppPath(), "build/icon.ico");
}

function profilesPath() {
  return path.join(app.getPath("userData"), "servers.json");
}

function preferencesPath() {
  return path.join(app.getPath("userData"), "preferences.json");
}

function canUseSafeStorage() {
  try {
    return safeStorage.isEncryptionAvailable();
  } catch {
    return false;
  }
}

function requireSafeStorage() {
  if (!canUseSafeStorage()) {
    throw new Error("Secure storage is not available on this system. Secret values cannot be saved safely.");
  }
}

function encryptSecret(value: string | undefined) {
  if (!value) return undefined;
  requireSafeStorage();
  return safeStorage.encryptString(value).toString("base64");
}

function decryptSecret(value: string | undefined) {
  if (!value) return undefined;
  requireSafeStorage();
  try {
    return safeStorage.decryptString(Buffer.from(value, "base64"));
  } catch {
    throw new Error("Failed to decrypt a saved server secret. Re-enter the server credentials.");
  }
}

function hasProfileSecrets(profile: StoredServerProfile | ServerProfile) {
  return Boolean(
    profile.security?.sasl?.clientSecret ||
    profile.schemaRegistry?.auth?.type === "basic" && profile.schemaRegistry.auth.password ||
    profile.schemaRegistry?.auth?.type === "bearer" && profile.schemaRegistry.auth.token
  );
}

function toStoredProfile(profile: ServerProfile): StoredServerProfile {
  const stored: StoredServerProfile = {
    id: profile.id,
    name: profile.name,
    brokers: profile.brokers
  };
  if (profile.security) {
    stored.security = {
      ssl: profile.security.ssl,
      sasl: profile.security.sasl
        ? {
            mechanism: profile.security.sasl.mechanism,
            tokenEndpoint: profile.security.sasl.tokenEndpoint,
            clientId: profile.security.sasl.clientId,
            clientSecretEncrypted: encryptSecret(profile.security.sasl.clientSecret),
            scope: profile.security.sasl.scope,
            audience: profile.security.sasl.audience
          }
        : undefined
    };
  }
  if (profile.schemaRegistry) {
    stored.schemaRegistry = {
      url: profile.schemaRegistry.url,
      auth: profile.schemaRegistry.auth?.type === "basic"
        ? {
            type: "basic",
            username: profile.schemaRegistry.auth.username,
            passwordEncrypted: encryptSecret(profile.schemaRegistry.auth.password)
          }
        : profile.schemaRegistry.auth?.type === "bearer"
          ? {
              type: "bearer",
              tokenEncrypted: encryptSecret(profile.schemaRegistry.auth.token)
            }
          : undefined
    };
  }
  return stored;
}

function fromStoredProfile(profile: StoredServerProfile): { profile: ServerProfile; migrated: boolean } {
  let migrated = false;
  const clientSecret = profile.security?.sasl?.clientSecret ??
    decryptSecret(profile.security?.sasl?.clientSecretEncrypted);
  const registryPassword = profile.schemaRegistry?.auth?.type === "basic"
    ? profile.schemaRegistry.auth.password ?? decryptSecret(profile.schemaRegistry.auth.passwordEncrypted)
    : undefined;
  const registryToken = profile.schemaRegistry?.auth?.type === "bearer"
    ? profile.schemaRegistry.auth.token ?? decryptSecret(profile.schemaRegistry.auth.tokenEncrypted)
    : undefined;

  if (
    profile.security?.sasl?.clientSecret ||
    profile.schemaRegistry?.auth?.type === "basic" && profile.schemaRegistry.auth.password ||
    profile.schemaRegistry?.auth?.type === "bearer" && profile.schemaRegistry.auth.token
  ) {
    migrated = true;
  }

  return {
    migrated,
    profile: {
      id: profile.id,
      name: profile.name,
      brokers: profile.brokers,
      security: profile.security
        ? {
            ssl: profile.security.ssl,
            sasl: profile.security.sasl
              ? {
                  mechanism: "oauthbearer",
                  tokenEndpoint: profile.security.sasl.tokenEndpoint,
                  clientId: profile.security.sasl.clientId,
                  clientSecret: clientSecret ?? "",
                  scope: profile.security.sasl.scope,
                  audience: profile.security.sasl.audience
                }
              : undefined
          }
        : undefined,
      schemaRegistry: profile.schemaRegistry
        ? {
            url: profile.schemaRegistry.url,
            auth: profile.schemaRegistry.auth?.type === "basic"
              ? {
                  type: "basic",
                  username: profile.schemaRegistry.auth.username,
                  password: registryPassword ?? ""
                }
              : profile.schemaRegistry.auth?.type === "bearer"
                ? {
                    type: "bearer",
                    token: registryToken ?? ""
                  }
                : undefined
          }
        : undefined
    }
  };
}

export function stripServerSecrets(profile: ServerProfile): ServerProfile {
  return {
    ...profile,
    security: profile.security
      ? {
          ...profile.security,
          sasl: profile.security.sasl
            ? {
                ...profile.security.sasl,
                clientSecret: ""
              }
            : undefined
        }
      : undefined,
    schemaRegistry: profile.schemaRegistry
      ? {
          ...profile.schemaRegistry,
          auth: profile.schemaRegistry.auth?.type === "basic"
            ? {
                type: "basic",
                username: profile.schemaRegistry.auth.username,
                password: ""
              }
            : profile.schemaRegistry.auth?.type === "bearer"
              ? {
                  type: "bearer",
                  token: ""
                }
              : undefined
        }
      : undefined
  };
}

export const defaultPreferences: AppPreferences = {
  favoriteTopicsByServer: {},
  consumeDefaults: {
    inspectorMode: "raw",
    inspectorCollapsed: false,
    keyFormat: "text",
    valueFormat: "json",
    payloadEncoding: "utf-8"
  },
  viewerPreferences: {
    retentionDays: 90,
    fontSize: 13,
    fontWeight: 600,
    byServer: {}
  },
  consumeDefaultsByServer: {},
  manualAvroSchemasByServer: {},
  layout: {},
  appearance: {
    fontFamily: "Inter, 'Noto Sans KR', 'Malgun Gothic', 'Apple SD Gothic Neo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: 13,
    fontWeight: 600,
    language: "auto"
  },
  keyboardShortcuts: {},
  diagnostics: {
    logRetentionDays: 14
  },
  releaseNotes: {},
  exportFormatTemplate: "[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}"
};

export async function readProfiles(): Promise<ServerProfile[]> {
  try {
    const file = await readFile(profilesPath(), "utf8");
    const storedProfiles = JSON.parse(file) as StoredServerProfile[];
    const converted = storedProfiles.map(fromStoredProfile);
    const profiles = converted.map((item) => item.profile);
    if (converted.some((item) => item.migrated)) {
      await writeProfiles(profiles);
    }
    return profiles;
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function readProfilesForExport(): Promise<ServerProfile[]> {
  return (await readProfiles()).map(stripServerSecrets);
}

export async function writeProfiles(profiles: ServerProfile[]) {
  if (profiles.some(hasProfileSecrets)) {
    requireSafeStorage();
  }
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(profilesPath(), JSON.stringify(profiles.map(toStoredProfile), null, 2), "utf8");
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
    consumeDefaults: preferences?.consumeDefaults ?? defaultPreferences.consumeDefaults,
    viewerPreferences: preferences?.viewerPreferences ?? defaultPreferences.viewerPreferences,
    consumeDefaultsByServer: preferences?.consumeDefaultsByServer ?? {},
    manualAvroSchemasByServer: preferences?.manualAvroSchemasByServer ?? {},
    layout: preferences?.layout ?? {},
    appearance: preferences?.appearance ?? defaultPreferences.appearance,
    keyboardShortcuts: preferences?.keyboardShortcuts ?? {},
    diagnostics: preferences?.diagnostics ?? defaultPreferences.diagnostics,
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
    consumeDefaults: {
      ...(current.consumeDefaults ?? {}),
      ...(next.consumeDefaults ?? {})
    },
    viewerPreferences: {
      ...(current.viewerPreferences ?? {}),
      ...(next.viewerPreferences ?? {}),
      byServer: next.viewerPreferences?.byServer ?? current.viewerPreferences?.byServer ?? {}
    },
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
    diagnostics: {
      ...(current.diagnostics ?? {}),
      ...(next.diagnostics ?? {})
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

function sameServerIdentity(left: ServerProfile, right: ServerProfile) {
  return left.id === right.id ||
    left.name === right.name && left.brokers.join(",") === right.brokers.join(",");
}

function isEmpty(value: string | undefined) {
  return !value || value.trim().length === 0;
}

export function preserveExistingSecrets(importedServers: ServerProfile[], existingServers: ServerProfile[]) {
  return importedServers.map((server) => {
    const existing = existingServers.find((item) => sameServerIdentity(item, server));
    if (!existing) return server;
    return {
      ...server,
      security: server.security
        ? {
            ...server.security,
            sasl: server.security.sasl
              ? {
                  ...server.security.sasl,
                  clientSecret: isEmpty(server.security.sasl.clientSecret)
                    ? existing.security?.sasl?.clientSecret ?? ""
                    : server.security.sasl.clientSecret
                }
              : undefined
          }
        : server.security,
      schemaRegistry: server.schemaRegistry
        ? {
            ...server.schemaRegistry,
            auth: server.schemaRegistry.auth?.type === "basic"
              ? {
                  ...server.schemaRegistry.auth,
                  password: isEmpty(server.schemaRegistry.auth.password)
                    ? existing.schemaRegistry?.auth?.type === "basic" ? existing.schemaRegistry.auth.password ?? "" : ""
                    : server.schemaRegistry.auth.password
                }
              : server.schemaRegistry.auth?.type === "bearer"
                ? {
                    ...server.schemaRegistry.auth,
                    token: isEmpty(server.schemaRegistry.auth.token)
                      ? existing.schemaRegistry?.auth?.type === "bearer" ? existing.schemaRegistry.auth.token ?? "" : ""
                      : server.schemaRegistry.auth.token
                  }
                : undefined
          }
        : server.schemaRegistry
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
