import type { TopicSummary } from "../shared/types";

export type ReplayTargetServer = {
  id: string;
  name: string;
  connected: boolean;
  topics: TopicSummary[];
};

export type ReplayPayloadOptions = {
  key: boolean;
  headers: boolean;
  value: boolean;
};

export type ReplayDraft = {
  key: string;
  headers: string;
  value: string;
};
