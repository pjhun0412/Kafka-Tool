import type { TopicDetail } from "../shared/types";

export type View = "brokers" | "topics" | "consumers" | "info" | "consume" | "produce" | "settings";
export type TopicWorkView = "info" | "consume" | "produce" | "settings";
export type WorkspacePaneId = "primary" | "split";
export type SplitDropSide = "left" | "right" | null;
export type DragPayload = { type: "topic"; serverId: string; topic: string; source: WorkspacePaneId } | { type: "split-pane" };
export type WorkspaceActionTarget = {
  pane: WorkspacePaneId;
  serverId: string;
  topic?: string;
};

export type SplitPaneState = {
  serverId: string;
  topic: string;
  topicTabs: string[];
  previewTopic?: string;
  view: View;
  detail: TopicDetail | null;
};
