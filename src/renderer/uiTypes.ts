import type { AppPreferences, ConsumedMessage, TopicSummary } from "../shared/types";

export type View = "brokers" | "topics" | "consumers" | "info" | "consume" | "produce";
export type TopicWorkView = "info" | "consume" | "produce";
export type ConsumeMode = "offset" | "timeRange" | "live";
export type ConsumeFilterField = "all" | "key" | "value" | "headers" | "headersEmpty" | "offset" | "partition" | "timestamp";
export type OffsetOrder = "asc" | "desc";
export type JsonInspectorMode = "raw" | "tree";
export type TopicListFilter = "all" | "favorites" | "nonEmpty";
export type TopicSortMode = "nameAsc" | "messagesDesc" | "partitionsDesc" | "favoritesFirst";
export type ToastState = { message: string; kind: "loading" | "success" | "error" } | null;
export type ConsumeDefaultPatch = AppPreferences["consumeDefaultsByServer"][string];
export type TopicAction = { kind: "delete" | "purge"; topics: string[] } | null;
export type DragPayload = { type: "topic"; serverId: string; topic: string; source: "primary" | "split" } | { type: "split-pane" };

export type SplitPaneState = {
  serverId: string;
  topic: string;
  topicTabs: string[];
  view: View;
  detail: import("../shared/types").TopicDetail | null;
};

export type TopicConsumeState = {
  messages: ConsumedMessage[];
  selectedMessage: ConsumedMessage | null;
  mode: ConsumeMode;
  offsetOrder: OffsetOrder;
  offset: string;
  limit: number;
  partition: string;
  timeStart: string;
  timeEnd: string;
  filterText: string;
  filterField: ConsumeFilterField;
  autoScroll: boolean;
  maxMessages: number;
  offsetPagination: {
    totalLimit: number;
    pageSize: number;
    pageIndex: number;
    currentOffset: string;
    prevOffsets: string[];
    nextOffset: string;
    hasNext: boolean;
    endOffsetExclusive?: string;
  } | null;
};

export const emptyServer = {
  name: "",
  brokers: "localhost:9092",
  ssl: false,
  oauthEnabled: false,
  oauthTokenEndpoint: "",
  oauthClientId: "",
  oauthClientSecret: "",
  oauthScope: "",
  oauthAudience: ""
};

export const emptyConsumeState: TopicConsumeState = {
  messages: [],
  selectedMessage: null,
  mode: "offset",
  offsetOrder: "asc",
  offset: "0",
  limit: 10,
  partition: "",
  timeStart: "",
  timeEnd: "",
  filterText: "",
  filterField: "all",
  autoScroll: true,
  maxMessages: 1000,
  offsetPagination: null
};

export const topicSortOptions: Array<{ value: TopicSortMode; label: string }> = [
  { value: "nameAsc", label: "Name A-Z" },
  { value: "messagesDesc", label: "Messages High-Low" },
  { value: "partitionsDesc", label: "Partitions High-Low" },
  { value: "favoritesFirst", label: "Favorites first" }
];

export const fontOptions = [
  { value: "D2Coding, Consolas, 'Courier New', monospace", label: "D2Coding stack" },
  { value: "Consolas, 'Courier New', monospace", label: "Consolas stack" },
  { value: "'JetBrains Mono', Consolas, monospace", label: "JetBrains Mono stack" },
  { value: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", label: "System UI stack" }
];

export type TopicSorter = (topics: TopicSummary[], sortMode: TopicSortMode, favoriteTopicNames: string[]) => TopicSummary[];
