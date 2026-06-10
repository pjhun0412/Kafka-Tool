import { useQuickSearchState, useServerSearchState, useTopicSearchState } from "../search";

type AppSearchCompositionParams = {
  servers: Parameters<typeof useServerSearchState>[0]["servers"];
  selectedServerId: string;
  contextServerId?: string;
  topicsByServer: Parameters<typeof useQuickSearchState>[0]["topicsByServer"];
  openedTopicTabsByServer: Parameters<typeof useQuickSearchState>[0]["openedTopicTabsByServer"];
  manualAvroSchemasByServer: Parameters<typeof useQuickSearchState>[0]["manualAvroSchemasByServer"];
  groupsByServer: Parameters<typeof useQuickSearchState>[0]["groupsByServer"];
  connectedServerIds: string[];
  favoriteTopicsByServer: Record<string, string[]>;
};

export function useAppSearchComposition(params: AppSearchCompositionParams) {
  const serverSearch = useServerSearchState({
    servers: params.servers,
    selectedServerId: params.selectedServerId,
    contextServerId: params.contextServerId
  });
  const quickSearch = useQuickSearchState({
    servers: params.servers,
    selectedServerId: params.selectedServerId,
    topicsByServer: params.topicsByServer,
    openedTopicTabsByServer: params.openedTopicTabsByServer,
    manualAvroSchemasByServer: params.manualAvroSchemasByServer,
    groupsByServer: params.groupsByServer
  });
  const isSelectedServerConnected = params.connectedServerIds.includes(params.selectedServerId);
  const topics = params.topicsByServer[params.selectedServerId] ?? [];
  const favoriteTopicNames = params.favoriteTopicsByServer[params.selectedServerId] ?? [];
  const topicSearch = useTopicSearchState({
    selectedServerId: params.selectedServerId,
    topics,
    favoriteTopicNames
  });

  return {
    serverSearch,
    quickSearch,
    topicSearch,
    isSelectedServerConnected,
    topics,
    favoriteTopicNames
  };
}
