import { ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import type { ServerProfile } from "../../shared/types.js";
import { createKafka } from "../kafkaClient.js";
import { readProfiles, writeProfiles } from "../storage.js";

export function registerServerIpcHandlers() {
  ipcMain.handle("servers:list", async () => readProfiles());

  ipcMain.handle("servers:save", async (_event, server: Omit<ServerProfile, "id"> & { id?: string }) => {
    const nextProfile = normalizeServerInput(server, { requireName: true });

    const profiles = await readProfiles();
    const nextProfiles = profiles.some((item) => item.id === nextProfile.id)
      ? profiles.map((item) => (item.id === nextProfile.id ? nextProfile : item))
      : [...profiles, nextProfile];
    await writeProfiles(nextProfiles);
    return nextProfiles;
  });

  ipcMain.handle("servers:test", async (_event, server: Omit<ServerProfile, "id"> & { id?: string }) => {
    const profile = normalizeServerInput(server, { requireName: false });
    const admin = createKafka(profile).admin();
    await admin.connect();
    try {
      await admin.describeCluster();
    } finally {
      await admin.disconnect();
    }
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
}

function normalizeServerInput(
  server: Omit<ServerProfile, "id"> & { id?: string },
  options: { requireName: boolean }
): ServerProfile {
  const brokers = server.brokers.map((broker) => broker.trim()).filter(Boolean);
  const name = server.name.trim();
  if (options.requireName && !name) {
    throw new Error("Enter a server name.");
  }
  if (brokers.length === 0) {
    throw new Error("Enter at least one broker address.");
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

  return {
    id: server.id ?? randomUUID(),
    name: name || "Temporary server",
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
}
