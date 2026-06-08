import type { ServerProfile } from "../shared/types";
import { emptyServer } from "./uiTypes";

export type ServerForm = typeof emptyServer;
export type ServerProfileInput = Omit<ServerProfile, "id"> & { id?: string };

export function buildServerSecurity(serverForm: ServerForm): ServerProfile["security"] | undefined {
  if (!serverForm.ssl && !serverForm.oauthEnabled) {
    return undefined;
  }
  return {
    ssl: serverForm.ssl,
    sasl: serverForm.oauthEnabled
      ? {
        mechanism: "oauthbearer",
        tokenEndpoint: serverForm.oauthTokenEndpoint.trim(),
        clientId: serverForm.oauthClientId.trim(),
        clientSecret: serverForm.oauthClientSecret,
        scope: serverForm.oauthScope.trim() || undefined,
        audience: serverForm.oauthAudience.trim() || undefined
      }
      : undefined
  };
}

export function buildSchemaRegistry(serverForm: ServerForm): ServerProfile["schemaRegistry"] | undefined {
  const url = serverForm.schemaRegistryUrl.trim();
  if (!url) return undefined;
  return {
    url,
    auth: serverForm.schemaRegistryAuthType === "basic"
      ? {
        type: "basic",
        username: serverForm.schemaRegistryUsername,
        password: serverForm.schemaRegistryPassword
      }
      : serverForm.schemaRegistryAuthType === "bearer"
        ? {
          type: "bearer",
          token: serverForm.schemaRegistryToken
        }
        : undefined
  };
}

export function buildServerProfileInput(editingServerId: string | null, serverForm: ServerForm): ServerProfileInput {
  return {
    id: editingServerId ?? undefined,
    name: serverForm.name,
    brokers: serverForm.brokers.split(",").map((broker) => broker.trim()),
    security: buildServerSecurity(serverForm),
    schemaRegistry: buildSchemaRegistry(serverForm)
  };
}
