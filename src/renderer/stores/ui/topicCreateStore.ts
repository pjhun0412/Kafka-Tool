import { create } from "zustand";

type SetValue<T> = T | ((current: T) => T);

export type TopicCreateConfigRow = {
  id: string;
  name: string;
  value: string;
};

export type TopicCreateForm = {
  serverId: string;
  topic: string;
  partitions: string;
  replicationFactor: string;
  cleanupPolicy: "delete" | "compact" | "compact,delete";
  minInSyncReplicas: string;
  retentionMs: string;
  retentionBytes: string;
  maxMessageBytes: string;
  configs: TopicCreateConfigRow[];
};

const emptyTopicCreateForm: TopicCreateForm = {
  serverId: "",
  topic: "",
  partitions: "1",
  replicationFactor: "1",
  cleanupPolicy: "delete",
  minInSyncReplicas: "",
  retentionMs: "",
  retentionBytes: "-1",
  maxMessageBytes: "",
  configs: []
};

type TopicCreateStore = {
  isTopicCreateOpen: boolean;
  topicCreateForm: TopicCreateForm;
  openTopicCreateForm: (serverId: string) => void;
  closeTopicCreateForm: () => void;
  setTopicCreateForm: (value: SetValue<TopicCreateForm>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useTopicCreateStore = create<TopicCreateStore>((set) => ({
  isTopicCreateOpen: false,
  topicCreateForm: emptyTopicCreateForm,
  openTopicCreateForm: (serverId) => set({
    isTopicCreateOpen: true,
    topicCreateForm: { ...emptyTopicCreateForm, serverId }
  }),
  closeTopicCreateForm: () => set({
    isTopicCreateOpen: false,
    topicCreateForm: emptyTopicCreateForm
  }),
  setTopicCreateForm: (topicCreateForm) => set((current) => ({
    topicCreateForm: resolveValue(topicCreateForm, current.topicCreateForm)
  }))
}));
