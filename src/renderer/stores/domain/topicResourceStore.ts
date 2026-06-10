import { create } from "zustand";
import type { SortingState } from "@tanstack/react-table";
import type { TopicDetail, TopicSummary } from "../../../shared/types";
import { resolveValue, type SetValue } from "./storeUtils";

type TopicResourceStore = {
  topicsByServer: Record<string, TopicSummary[]>;
  topicGridSortingByServer: Record<string, SortingState>;
  favoriteTopicsByServer: Record<string, string[]>;
  topicDetailByServer: Record<string, TopicDetail | null>;
  topicDetailCacheByServer: Record<string, Record<string, TopicDetail>>;
  setTopicsByServer: (value: SetValue<Record<string, TopicSummary[]>>) => void;
  setTopicGridSortingByServer: (value: SetValue<Record<string, SortingState>>) => void;
  setFavoriteTopicsByServer: (value: SetValue<Record<string, string[]>>) => void;
  setTopicDetailByServer: (value: SetValue<Record<string, TopicDetail | null>>) => void;
  setTopicDetailCacheByServer: (value: SetValue<Record<string, Record<string, TopicDetail>>>) => void;
};

export const useTopicResourceStore = create<TopicResourceStore>((set) => ({
  topicsByServer: {},
  topicGridSortingByServer: {},
  favoriteTopicsByServer: {},
  topicDetailByServer: {},
  topicDetailCacheByServer: {},
  setTopicsByServer: (topicsByServer) => set((current) => ({
    topicsByServer: resolveValue(topicsByServer, current.topicsByServer)
  })),
  setTopicGridSortingByServer: (topicGridSortingByServer) => set((current) => ({
    topicGridSortingByServer: resolveValue(topicGridSortingByServer, current.topicGridSortingByServer)
  })),
  setFavoriteTopicsByServer: (favoriteTopicsByServer) => set((current) => ({
    favoriteTopicsByServer: resolveValue(favoriteTopicsByServer, current.favoriteTopicsByServer)
  })),
  setTopicDetailByServer: (topicDetailByServer) => set((current) => ({
    topicDetailByServer: resolveValue(topicDetailByServer, current.topicDetailByServer)
  })),
  setTopicDetailCacheByServer: (topicDetailCacheByServer) => set((current) => ({
    topicDetailCacheByServer: resolveValue(topicDetailCacheByServer, current.topicDetailCacheByServer)
  }))
}));
