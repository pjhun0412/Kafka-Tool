import type { AppPreferences, ConsumedMessage } from "../shared/types";

export type ConsumeMode = "offset" | "timeRange" | "live";
export type ConsumeFilterField = "all" | "key" | "value" | "headers" | "headersEmpty" | "offset" | "partition" | "timestamp";
export type ConsumeFilterMode = "hide" | "highlight";
export type OffsetOrder = "asc" | "desc";
export type MessageInspectorMode = "raw" | "tree" | "preview";
export type MessagePayloadTarget = "key" | "value" | "headers" | "message";
export type MessagePayloadFormat = "json" | "text" | "hex" | "base64";
export type MessagePreviewMode = MessagePayloadFormat | "metadata";
export type MessagePreviewEncoding = "utf-8" | "euc-kr";
export type ConsumeDefaultPatch = AppPreferences["consumeDefaultsByServer"][string];

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
  filterMode: ConsumeFilterMode;
  inspectorMode: MessageInspectorMode;
  inspectorCollapsed: boolean;
  autoScroll: boolean;
  maxMessages: number;
  liveRecordEnabled: boolean;
  liveRecordPath: string;
  liveRecordCount: number;
  keyFormat: Extract<MessagePayloadFormat, "text" | "hex" | "base64">;
  valueFormat: MessagePayloadFormat;
  payloadEncoding: MessagePreviewEncoding;
  valueColumnPaths: string[];
  messagePaneHeight: number;
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
  filterMode: "hide",
  inspectorMode: "raw",
  inspectorCollapsed: false,
  autoScroll: true,
  maxMessages: 1000,
  liveRecordEnabled: false,
  liveRecordPath: "",
  liveRecordCount: 0,
  keyFormat: "text",
  valueFormat: "json",
  payloadEncoding: "utf-8",
  valueColumnPaths: [],
  messagePaneHeight: 230,
  offsetPagination: null
};
