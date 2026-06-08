import { create } from "zustand";
import type { ServerProfile } from "../../../shared/types";
import { emptyServer } from "../../uiTypes";
import type { ServerForm } from "../../serverProfileForm";

type SetValue<T> = T | ((current: T) => T);

type ServerFormStore = {
  serverForm: ServerForm;
  editingServerId: string | null;
  isServerFormOpen: boolean;
  setServerForm: (value: SetValue<ServerForm>) => void;
  setEditingServerId: (value: SetValue<string | null>) => void;
  setIsServerFormOpen: (value: SetValue<boolean>) => void;
  openNewServerForm: () => void;
  openEditServerForm: (server: ServerProfile) => void;
  closeServerForm: () => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

function toServerForm(server: ServerProfile): ServerForm {
  return {
    name: server.name,
    brokers: server.brokers.join(", "),
    ssl: Boolean(server.security?.ssl),
    oauthEnabled: server.security?.sasl?.mechanism === "oauthbearer",
    oauthTokenEndpoint: server.security?.sasl?.tokenEndpoint ?? "",
    oauthClientId: server.security?.sasl?.clientId ?? "",
    oauthClientSecret: server.security?.sasl?.clientSecret ?? "",
    oauthScope: server.security?.sasl?.scope ?? "",
    oauthAudience: server.security?.sasl?.audience ?? "",
    schemaRegistryUrl: server.schemaRegistry?.url ?? "",
    schemaRegistryAuthType: server.schemaRegistry?.auth?.type ?? "none",
    schemaRegistryUsername: server.schemaRegistry?.auth?.username ?? "",
    schemaRegistryPassword: server.schemaRegistry?.auth?.password ?? "",
    schemaRegistryToken: server.schemaRegistry?.auth?.token ?? ""
  };
}

export const useServerFormStore = create<ServerFormStore>((set) => ({
  serverForm: emptyServer,
  editingServerId: null,
  isServerFormOpen: false,
  setServerForm: (serverForm) => set((current) => ({ serverForm: resolveValue(serverForm, current.serverForm) })),
  setEditingServerId: (editingServerId) => set((current) => ({
    editingServerId: resolveValue(editingServerId, current.editingServerId)
  })),
  setIsServerFormOpen: (isServerFormOpen) => set((current) => ({
    isServerFormOpen: resolveValue(isServerFormOpen, current.isServerFormOpen)
  })),
  openNewServerForm: () => set({
    editingServerId: null,
    serverForm: emptyServer,
    isServerFormOpen: true
  }),
  openEditServerForm: (server) => set({
    editingServerId: server.id,
    serverForm: toServerForm(server),
    isServerFormOpen: true
  }),
  closeServerForm: () => set({
    editingServerId: null,
    serverForm: emptyServer,
    isServerFormOpen: false
  })
}));
