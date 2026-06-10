import {
  useAppSearchComposition,
  useTopicListActions
} from "..";

type AppSearchParams = Parameters<typeof useAppSearchComposition>[0];
type TopicListActionsParams = Parameters<typeof useTopicListActions>[0];

export function useWorkspaceControllerSearch({
  appSearch: appSearchParams,
  favorites,
  rowSelection,
  selectedTopicByServer,
  selectedServerId
}: {
  appSearch: AppSearchParams;
  favorites: TopicListActionsParams["favorites"];
  rowSelection: Omit<TopicListActionsParams["rowSelection"], "selectedTopicRows" | "setSelectedTopicRows">;
  selectedTopicByServer: Record<string, string>;
  selectedServerId: string;
}) {
  const appSearch = useAppSearchComposition(appSearchParams);
  const {
    serverQuery,
    setServerQuery,
    selectedServer,
    contextServer,
    filteredServers
  } = appSearch.serverSearch;
  const {
    isQuickSearchOpen,
    quickSearchQuery,
    setQuickSearchQuery,
    quickSearchIndex,
    setQuickSearchIndex,
    quickSearchResults,
    quickSearchScope,
    openQuickSearch,
    closeQuickSearch,
    rememberQuickSearch
  } = appSearch.quickSearch;
  const {
    isSelectedServerConnected,
    topics,
    favoriteTopicNames
  } = appSearch;
  const {
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
    removeSelectedTopicRowsForServer
  } = appSearch.topicSearch;
  const {
    favoriteActions,
    rowSelectionActions
  } = useTopicListActions({
    favorites,
    rowSelection: {
      ...rowSelection,
      selectedTopicRows,
      setSelectedTopicRows
    }
  });

  return {
    serverSearch: {
      serverQuery,
      setServerQuery,
      selectedServer,
      contextServer,
      filteredServers
    },
    quickSearch: {
      isQuickSearchOpen,
      quickSearchQuery,
      setQuickSearchQuery,
      quickSearchIndex,
      setQuickSearchIndex,
      quickSearchResults,
      quickSearchScope,
      openQuickSearch,
      closeQuickSearch,
      rememberQuickSearch
    },
    topicSearch: {
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
      removeSelectedTopicRowsForServer
    },
    selectedTopic: selectedTopicByServer[selectedServerId] ?? "",
    isSelectedServerConnected,
    topics,
    favoriteTopicNames,
    favoriteActions,
    rowSelectionActions
  };
}
