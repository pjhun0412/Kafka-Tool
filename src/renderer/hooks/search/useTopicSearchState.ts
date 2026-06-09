import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import type { TopicSummary } from "../../../shared/types";
import { parseTopicCount, sortTopics } from "../../utils";
import { matchesTopicSearch, parseTopicSearchQuery } from "../../topicSearch";
import { useSearchStore } from "../../stores/ui/searchStore";

type TopicSearchStateParams = {
  selectedServerId: string;
  topics: TopicSummary[];
  favoriteTopicNames: string[];
};

export function useTopicSearchState({ selectedServerId, topics, favoriteTopicNames }: TopicSearchStateParams) {
  const {
    topicQueryByServer,
    topicSearchHistoryByServer,
    topicFilterByServer,
    topicSortByServer,
    selectedTopicRowsByServer,
    setTopicQueryForServer,
    commitTopicSearchForServer,
    removeTopicSearchHistoryForServer,
    setTopicFilterForServer,
    setTopicSortForServer,
    setSelectedTopicRowsForServer,
    clearTopicQueryForServer,
    keepSelectedTopicRowsForServer,
    removeSelectedTopicRowsForServer,
    resetTopicSearchState
  } = useSearchStore(useShallow((state) => ({
    topicQueryByServer: state.topicQueryByServer,
    topicSearchHistoryByServer: state.topicSearchHistoryByServer,
    topicFilterByServer: state.topicFilterByServer,
    topicSortByServer: state.topicSortByServer,
    selectedTopicRowsByServer: state.selectedTopicRowsByServer,
    setTopicQueryForServer: state.setTopicQueryForServer,
    commitTopicSearchForServer: state.commitTopicSearchForServer,
    removeTopicSearchHistoryForServer: state.removeTopicSearchHistoryForServer,
    setTopicFilterForServer: state.setTopicFilterForServer,
    setTopicSortForServer: state.setTopicSortForServer,
    setSelectedTopicRowsForServer: state.setSelectedTopicRowsForServer,
    clearTopicQueryForServer: state.clearTopicQueryForServer,
    keepSelectedTopicRowsForServer: state.keepSelectedTopicRowsForServer,
    removeSelectedTopicRowsForServer: state.removeSelectedTopicRowsForServer,
    resetTopicSearchState: state.resetTopicSearchState
  })));

  const topicQuery = topicQueryByServer[selectedServerId] ?? "";
  const topicSearchHistory = topicSearchHistoryByServer[selectedServerId] ?? [];
  const topicFilter = topicFilterByServer[selectedServerId] ?? "all";
  const topicSort = topicSortByServer[selectedServerId] ?? "nameAsc";
  const selectedTopicRows = selectedTopicRowsByServer[selectedServerId] ?? [];

  function setTopicQuery(topicQuery: string) {
    setTopicQueryForServer(selectedServerId, topicQuery);
  }

  function commitTopicSearch(query = topicQuery) {
    commitTopicSearchForServer(selectedServerId, query);
  }

  function removeTopicSearchHistory(query: string) {
    removeTopicSearchHistoryForServer(selectedServerId, query);
  }

  function setTopicFilter(topicFilter: Parameters<typeof setTopicFilterForServer>[1]) {
    setTopicFilterForServer(selectedServerId, topicFilter);
  }

  function setTopicSort(topicSort: Parameters<typeof setTopicSortForServer>[1]) {
    setTopicSortForServer(selectedServerId, topicSort);
  }

  function setSelectedTopicRows(action: string[] | ((current: string[]) => string[])) {
    setSelectedTopicRowsForServer(selectedServerId, action);
  }

  const filteredTopics = useMemo(() => {
    const searchQuery = parseTopicSearchQuery(topicQuery);
    return topics.filter((topic) => {
      const matchesSearch = !topicQuery.trim() || matchesTopicSearch(topic.name, searchQuery);
      const count = parseTopicCount(topic.messageCount);
      const matchesFilter =
        topicFilter === "all" ||
        (topicFilter === "favorites" && favoriteTopicNames.includes(topic.name)) ||
        (topicFilter === "nonEmpty" && count > 0n);
      return matchesSearch && matchesFilter;
    });
  }, [favoriteTopicNames, topicFilter, topicQuery, topics]);

  const topicSearchError = useMemo(() => parseTopicSearchQuery(topicQuery).error, [topicQuery]);
  const sortedTopics = useMemo(
    () => sortTopics(filteredTopics, topicSort, favoriteTopicNames),
    [favoriteTopicNames, filteredTopics, topicSort]
  );
  const favoriteTopics = useMemo(
    () => favoriteTopicNames
      .map((name) => sortedTopics.find((topic) => topic.name === name))
      .filter((topic): topic is TopicSummary => Boolean(topic)),
    [favoriteTopicNames, sortedTopics]
  );
  const nonFavoriteFilteredTopics = useMemo(
    () => sortedTopics.filter((topic) => !favoriteTopicNames.includes(topic.name)),
    [favoriteTopicNames, sortedTopics]
  );

  return {
    topicQuery,
    topicSearchHistory,
    topicFilter,
    topicSort,
    selectedTopicRows,
    filteredTopics,
    topicSearchError,
    sortedTopics,
    favoriteTopics,
    nonFavoriteFilteredTopics,
    setTopicQuery,
    commitTopicSearch,
    removeTopicSearchHistory,
    setTopicFilter,
    setTopicSort,
    setSelectedTopicRows,
    clearTopicQueryForServer,
    keepSelectedTopicRowsForServer,
    removeSelectedTopicRowsForServer,
    resetTopicSearchState
  };
}
