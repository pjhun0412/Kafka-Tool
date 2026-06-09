import type { WorkspacePaneId } from "./workspaceTypes";

export type ToastState = { message: string; kind: "loading" | "success" | "error" } | null;
export type PaneToastState = {
  pane: WorkspacePaneId;
  message: string;
  kind: "loading" | "success" | "error";
  serverId?: string;
  topic?: string;
} | null;
