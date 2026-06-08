import { create } from "zustand";
import type { SortingState } from "@tanstack/react-table";
import type {
  AppPreferences,
  BrokerSummary,
  ConsumerGroupLagDetail,
  ConsumerGroupSummary,
  ManualAvroSchema,
  TopicDetail,
  TopicSummary
} from "../../../shared/types";
import type { TopicWorkView, View } from "../../uiTypes";

type SetValue<T> = T | ((current: T) => T);

type KafkaResourceStore = {
  viewByServer: Record<string, View>;
  topicViewByServer: Record<string, Record<string, TopicWorkView>>;
  topicsByServer: Record<string, TopicSummary[]>;
  topicGridSortingByServer: Record<string, SortingState>;
  favoriteTopicsByServer: Record<string, string[]>;
  consumeDefaultsByServer: AppPreferences["consumeDefaultsByServer"];
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  preferencesLoaded: boolean;
  selectedTopicByServer: Record<string, string>;
  openedTopicTabsByServer: Record<string, string[]>;
  topicDetailByServer: Record<string, TopicDetail | null>;
  topicDetailCacheByServer: Record<string, Record<string, TopicDetail>>;
  brokersByServer: Record<string, BrokerSummary[]>;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
  selectedGroupByServer: Record<string, string>;
  groupLagByServer: Record<string, Record<string, ConsumerGroupLagDetail>>;
  streamingTopicsByServer: Record<string, string[]>;
  setViewByServer: (value: SetValue<Record<string, View>>) => void;
  setTopicViewByServer: (value: SetValue<Record<string, Record<string, TopicWorkView>>>) => void;
  setTopicsByServer: (value: SetValue<Record<string, TopicSummary[]>>) => void;
  setTopicGridSortingByServer: (value: SetValue<Record<string, SortingState>>) => void;
  setFavoriteTopicsByServer: (value: SetValue<Record<string, string[]>>) => void;
  setConsumeDefaultsByServer: (value: SetValue<AppPreferences["consumeDefaultsByServer"]>) => void;
  setManualAvroSchemasByServer: (value: SetValue<Record<string, Record<string, ManualAvroSchema>>>) => void;
  setPreferencesLoaded: (value: SetValue<boolean>) => void;
  setSelectedTopicByServer: (value: SetValue<Record<string, string>>) => void;
  setOpenedTopicTabsByServer: (value: SetValue<Record<string, string[]>>) => void;
  setTopicDetailByServer: (value: SetValue<Record<string, TopicDetail | null>>) => void;
  setTopicDetailCacheByServer: (value: SetValue<Record<string, Record<string, TopicDetail>>>) => void;
  setBrokersByServer: (value: SetValue<Record<string, BrokerSummary[]>>) => void;
  setGroupsByServer: (value: SetValue<Record<string, ConsumerGroupSummary[]>>) => void;
  setSelectedGroupByServer: (value: SetValue<Record<string, string>>) => void;
  setGroupLagByServer: (value: SetValue<Record<string, Record<string, ConsumerGroupLagDetail>>>) => void;
  setStreamingTopicsByServer: (value: SetValue<Record<string, string[]>>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useKafkaResourceStore = create<KafkaResourceStore>((set) => ({
  viewByServer: {},
  topicViewByServer: {},
  topicsByServer: {},
  topicGridSortingByServer: {},
  favoriteTopicsByServer: {},
  consumeDefaultsByServer: {},
  manualAvroSchemasByServer: {},
  preferencesLoaded: false,
  selectedTopicByServer: {},
  openedTopicTabsByServer: {},
  topicDetailByServer: {},
  topicDetailCacheByServer: {},
  brokersByServer: {},
  groupsByServer: {},
  selectedGroupByServer: {},
  groupLagByServer: {},
  streamingTopicsByServer: {},
  setViewByServer: (viewByServer) => set((current) => ({ viewByServer: resolveValue(viewByServer, current.viewByServer) })),
  setTopicViewByServer: (topicViewByServer) => set((current) => ({
    topicViewByServer: resolveValue(topicViewByServer, current.topicViewByServer)
  })),
  setTopicsByServer: (topicsByServer) => set((current) => ({
    topicsByServer: resolveValue(topicsByServer, current.topicsByServer)
  })),
  setTopicGridSortingByServer: (topicGridSortingByServer) => set((current) => ({
    topicGridSortingByServer: resolveValue(topicGridSortingByServer, current.topicGridSortingByServer)
  })),
  setFavoriteTopicsByServer: (favoriteTopicsByServer) => set((current) => ({
    favoriteTopicsByServer: resolveValue(favoriteTopicsByServer, current.favoriteTopicsByServer)
  })),
  setConsumeDefaultsByServer: (consumeDefaultsByServer) => set((current) => ({
    consumeDefaultsByServer: resolveValue(consumeDefaultsByServer, current.consumeDefaultsByServer)
  })),
  setManualAvroSchemasByServer: (manualAvroSchemasByServer) => set((current) => ({
    manualAvroSchemasByServer: resolveValue(manualAvroSchemasByServer, current.manualAvroSchemasByServer)
  })),
  setPreferencesLoaded: (preferencesLoaded) => set((current) => ({
    preferencesLoaded: resolveValue(preferencesLoaded, current.preferencesLoaded)
  })),
  setSelectedTopicByServer: (selectedTopicByServer) => set((current) => ({
    selectedTopicByServer: resolveValue(selectedTopicByServer, current.selectedTopicByServer)
  })),
  setOpenedTopicTabsByServer: (openedTopicTabsByServer) => set((current) => ({
    openedTopicTabsByServer: resolveValue(openedTopicTabsByServer, current.openedTopicTabsByServer)
  })),
  setTopicDetailByServer: (topicDetailByServer) => set((current) => ({
    topicDetailByServer: resolveValue(topicDetailByServer, current.topicDetailByServer)
  })),
  setTopicDetailCacheByServer: (topicDetailCacheByServer) => set((current) => ({
    topicDetailCacheByServer: resolveValue(topicDetailCacheByServer, current.topicDetailCacheByServer)
  })),
  setBrokersByServer: (brokersByServer) => set((current) => ({
    brokersByServer: resolveValue(brokersByServer, current.brokersByServer)
  })),
  setGroupsByServer: (groupsByServer) => set((current) => ({
    groupsByServer: resolveValue(groupsByServer, current.groupsByServer)
  })),
  setSelectedGroupByServer: (selectedGroupByServer) => set((current) => ({
    selectedGroupByServer: resolveValue(selectedGroupByServer, current.selectedGroupByServer)
  })),
  setGroupLagByServer: (groupLagByServer) => set((current) => ({
    groupLagByServer: resolveValue(groupLagByServer, current.groupLagByServer)
  })),
  setStreamingTopicsByServer: (streamingTopicsByServer) => set((current) => ({
    streamingTopicsByServer: resolveValue(streamingTopicsByServer, current.streamingTopicsByServer)
  }))
}));
