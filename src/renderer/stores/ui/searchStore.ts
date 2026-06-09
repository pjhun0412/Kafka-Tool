import { create } from "zustand";
import type { TopicListFilter, TopicSortMode } from "../../uiTypes";
import { parseTopicSearchQuery, TOPIC_SEARCH_HISTORY_LIMIT } from "../../topicSearch";
import type { QuickSearchResult } from "../../quickSearch";

type SetValue<T> = T | ((current: T) => T);

type SearchStore = {
  serverQuery: string;
  topicQueryByServer: Record<string, string>;
  topicSearchHistoryByServer: Record<string, string[]>;
  topicFilterByServer: Record<string, TopicListFilter>;
  topicSortByServer: Record<string, TopicSortMode>;
  selectedTopicRowsByServer: Record<string, string[]>;
  isQuickSearchOpen: boolean;
  quickSearchQuery: string;
  quickSearchIndex: number;
  quickSearchRecentKeys: string[];
  setServerQuery: (query: string) => void;
  setTopicQueryForServer: (serverId: string, query: string) => void;
  commitTopicSearchForServer: (serverId: string, query: string) => void;
  removeTopicSearchHistoryForServer: (serverId: string, query: string) => void;
  setTopicFilterForServer: (serverId: string, topicFilter: TopicListFilter) => void;
  setTopicSortForServer: (serverId: string, topicSort: TopicSortMode) => void;
  setSelectedTopicRowsForServer: (serverId: string, value: SetValue<string[]>) => void;
  clearTopicQueryForServer: (serverId: string) => void;
  keepSelectedTopicRowsForServer: (serverId: string, topicNames: Iterable<string>) => void;
  removeSelectedTopicRowsForServer: (serverId: string, topicNames: Iterable<string>) => void;
  resetTopicSearchState: () => void;
  setQuickSearchQuery: (query: string) => void;
  setQuickSearchIndex: (value: SetValue<number>) => void;
  openQuickSearch: (initialQuery?: string) => void;
  closeQuickSearch: () => void;
  rememberQuickSearch: (result: QuickSearchResult) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useSearchStore = create<SearchStore>((set) => ({
  serverQuery: "",
  topicQueryByServer: {},
  topicSearchHistoryByServer: {},
  topicFilterByServer: {},
  topicSortByServer: {},
  selectedTopicRowsByServer: {},
  isQuickSearchOpen: false,
  quickSearchQuery: "",
  quickSearchIndex: 0,
  quickSearchRecentKeys: [],
  setServerQuery: (serverQuery) => set({ serverQuery }),
  setTopicQueryForServer: (serverId, topicQuery) => {
    if (!serverId) return;
    set((current) => ({ topicQueryByServer: { ...current.topicQueryByServer, [serverId]: topicQuery } }));
  },
  commitTopicSearchForServer: (serverId, query) => {
    if (!serverId) return;
    const trimmed = query.trim();
    if (!trimmed || parseTopicSearchQuery(trimmed).error) return;
    set((current) => {
      const previous = current.topicSearchHistoryByServer[serverId] ?? [];
      const next = [trimmed, ...previous.filter((item) => item !== trimmed)].slice(0, TOPIC_SEARCH_HISTORY_LIMIT);
      return { topicSearchHistoryByServer: { ...current.topicSearchHistoryByServer, [serverId]: next } };
    });
  },
  removeTopicSearchHistoryForServer: (serverId, query) => {
    if (!serverId) return;
    set((current) => ({
      topicSearchHistoryByServer: {
        ...current.topicSearchHistoryByServer,
        [serverId]: (current.topicSearchHistoryByServer[serverId] ?? []).filter((item) => item !== query)
      }
    }));
  },
  setTopicFilterForServer: (serverId, topicFilter) => {
    if (!serverId) return;
    set((current) => ({ topicFilterByServer: { ...current.topicFilterByServer, [serverId]: topicFilter } }));
  },
  setTopicSortForServer: (serverId, topicSort) => {
    if (!serverId) return;
    set((current) => ({ topicSortByServer: { ...current.topicSortByServer, [serverId]: topicSort } }));
  },
  setSelectedTopicRowsForServer: (serverId, value) => {
    if (!serverId) return;
    set((current) => {
      const previous = current.selectedTopicRowsByServer[serverId] ?? [];
      return {
        selectedTopicRowsByServer: {
          ...current.selectedTopicRowsByServer,
          [serverId]: resolveValue(value, previous)
        }
      };
    });
  },
  clearTopicQueryForServer: (serverId) => {
    if (!serverId) return;
    set((current) => ({ topicQueryByServer: { ...current.topicQueryByServer, [serverId]: "" } }));
  },
  keepSelectedTopicRowsForServer: (serverId, topicNames) => {
    if (!serverId) return;
    const validTopics = new Set(topicNames);
    set((current) => ({
      selectedTopicRowsByServer: {
        ...current.selectedTopicRowsByServer,
        [serverId]: (current.selectedTopicRowsByServer[serverId] ?? []).filter((topic) => validTopics.has(topic))
      }
    }));
  },
  removeSelectedTopicRowsForServer: (serverId, topicNames) => {
    if (!serverId) return;
    const removedTopics = new Set(topicNames);
    set((current) => ({
      selectedTopicRowsByServer: {
        ...current.selectedTopicRowsByServer,
        [serverId]: (current.selectedTopicRowsByServer[serverId] ?? []).filter((topic) => !removedTopics.has(topic))
      }
    }));
  },
  resetTopicSearchState: () => set({
    topicQueryByServer: {},
    topicSearchHistoryByServer: {},
    topicFilterByServer: {},
    topicSortByServer: {},
    selectedTopicRowsByServer: {}
  }),
  setQuickSearchQuery: (quickSearchQuery) => set({ quickSearchQuery }),
  setQuickSearchIndex: (quickSearchIndex) => set((current) => ({
    quickSearchIndex: resolveValue(quickSearchIndex, current.quickSearchIndex)
  })),
  openQuickSearch: (initialQuery = "") => set({
    isQuickSearchOpen: true,
    quickSearchQuery: initialQuery,
    quickSearchIndex: 0
  }),
  closeQuickSearch: () => set({
    isQuickSearchOpen: false,
    quickSearchQuery: "",
    quickSearchIndex: 0
  }),
  rememberQuickSearch: (result) => {
    if (!result.recentKey) return;
    set((current) => ({
      quickSearchRecentKeys: [
        result.recentKey!,
        ...current.quickSearchRecentKeys.filter((key) => key !== result.recentKey)
      ].slice(0, 12)
    }));
  }
}));
