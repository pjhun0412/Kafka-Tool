import { useWorkspaceChromeCompositions } from "../layout/useWorkspaceChromeCompositions";

type SidebarPropsParams = Parameters<typeof useWorkspaceChromeCompositions>[0]["sidebar"];
type OverlayPropsParams = Parameters<typeof useWorkspaceChromeCompositions>[0]["overlay"];

type ControllerChromeState = Pick<
  SidebarPropsParams,
  | "serverPanelHeight"
  | "servers"
  | "selectedServerId"
  | "draggingServerId"
  | "serverDropTarget"
  | "connectedServerIds"
  | "failedServerIds"
  | "isTopicSortMenuOpen"
  | "loading"
  | "draggingFavoriteTopic"
  | "favoriteDropTarget"
  | "onNewServer"
  | "onServerSelect"
  | "onServerDragStart"
  | "onServerDropTarget"
  | "onServerPanelResize"
  | "onTopicSortMenuOpen"
  | "onFavoriteDragStart"
  | "onFavoriteDropTarget"
> &
  Pick<
    OverlayPropsParams,
    | "fontFamily"
    | "fontSize"
    | "language"
    | "resolvedLanguage"
    | "exportFormatTemplate"
    | "manualAvroSchemasByServer"
    | "topicContextMenu"
    | "serverContextMenu"
    | "onFontFamily"
    | "onFontSize"
    | "onLanguage"
    | "onExportFormatTemplate"
    | "onCloseTopicMenu"
    | "onCloseServerMenu"
    | "onEditServer"
  >;

type ControllerChromeSearch = {
  serverSearch: Pick<SidebarPropsParams, "serverQuery" | "filteredServers" | "onServerQuery">;
  topicSearch: Pick<
    SidebarPropsParams,
    | "filteredTopics"
    | "favoriteTopics"
    | "nonFavoriteFilteredTopics"
    | "topicQuery"
    | "topicSearchHistory"
    | "topicSearchError"
    | "topicFilter"
    | "topicSort"
    | "onTopicSort"
    | "onTopicQuery"
    | "onTopicFilter"
  >;
  quickSearch: Pick<
    OverlayPropsParams,
    | "isQuickSearchOpen"
    | "quickSearchQuery"
    | "quickSearchResults"
    | "quickSearchIndex"
    | "quickSearchScope"
    | "onQuickSearchQuery"
    | "onQuickSearchIndex"
    | "onCloseQuickSearch"
  >;
  isSelectedServerConnected: SidebarPropsParams["isSelectedServerConnected"];
  topics: SidebarPropsParams["topics"];
  favoriteTopicNames: SidebarPropsParams["favoriteTopicNames"];
  selectedTopic: SidebarPropsParams["selectedTopic"];
};

type WorkspaceControllerChromeParams = {
  state: ControllerChromeState;
  search: ControllerChromeSearch;
  sidebar: Pick<
    SidebarPropsParams,
    | "onCommitTopicSearch"
    | "onFavoriteDragEnd"
    | "onFavoriteDrop"
    | "onRemoveTopicSearchHistory"
    | "onServerContextMenu"
    | "onServerDragEnd"
    | "onServerDrop"
    | "openCluster"
    | "openTopicTab"
    | "refreshTopics"
    | "selectTopicInWorkspace"
    | "getWorkspaceTargetForTopic"
    | "onTopicFavorite"
    | "onTopicContextMenu"
  >;
  overlay: Pick<
    OverlayPropsParams,
    | "confirmTopicAction"
    | "connectServer"
    | "copySelectedTopicNames"
    | "deleteServer"
    | "disconnectServer"
    | "onCreateTopic"
    | "onDeleteManualAvroSchema"
    | "onDeleteManualAvroSchemaFor"
    | "onExecuteQuickSearch"
    | "onOpenManualAvroSchema"
    | "onReadSchemaFile"
    | "onRegisterAvroSchema"
    | "onSaveManualAvroSchema"
    | "onSaveServer"
    | "onTopicAction"
    | "openTopicTab"
  >;
  manualAvroSchemaRows: OverlayPropsParams["manualAvroSchemaRows"];
  manualAvroTopicNames: SidebarPropsParams["manualAvroTopicNames"];
  contextTopic: OverlayPropsParams["contextTopic"];
  contextServer: OverlayPropsParams["contextServer"];
};

export function useWorkspaceControllerChrome({
  state,
  search,
  sidebar,
  overlay,
  manualAvroSchemaRows,
  manualAvroTopicNames,
  contextTopic,
  contextServer
}: WorkspaceControllerChromeParams) {
  return useWorkspaceChromeCompositions({
    sidebar: {
      serverPanelHeight: state.serverPanelHeight,
      serverQuery: search.serverSearch.serverQuery,
      servers: state.servers,
      filteredServers: search.serverSearch.filteredServers,
      selectedServerId: state.selectedServerId,
      draggingServerId: state.draggingServerId,
      serverDropTarget: state.serverDropTarget,
      connectedServerIds: state.connectedServerIds,
      failedServerIds: state.failedServerIds,
      topics: search.topics,
      filteredTopics: search.topicSearch.filteredTopics,
      favoriteTopics: search.topicSearch.favoriteTopics,
      nonFavoriteFilteredTopics: search.topicSearch.nonFavoriteFilteredTopics,
      favoriteTopicNames: search.favoriteTopicNames,
      manualAvroTopicNames,
      selectedTopic: search.selectedTopic,
      topicQuery: search.topicSearch.topicQuery,
      topicSearchHistory: search.topicSearch.topicSearchHistory,
      topicSearchError: search.topicSearch.topicSearchError,
      topicFilter: search.topicSearch.topicFilter,
      topicSort: search.topicSearch.topicSort,
      isTopicSortMenuOpen: state.isTopicSortMenuOpen,
      isSelectedServerConnected: search.isSelectedServerConnected,
      loading: state.loading,
      draggingFavoriteTopic: state.draggingFavoriteTopic,
      favoriteDropTarget: state.favoriteDropTarget,
      onNewServer: state.openNewServerForm,
      onServerQuery: search.serverSearch.setServerQuery,
      onServerSelect: state.setSelectedServerId,
      onServerDragStart: state.setDraggingServerId,
      onServerDropTarget: state.setServerDropTarget,
      onServerPanelResize: state.startServerPanelResize,
      onTopicSortMenuOpen: state.setIsTopicSortMenuOpen,
      onTopicSort: search.topicSearch.setTopicSort,
      onTopicQuery: search.topicSearch.setTopicQuery,
      onTopicFilter: search.topicSearch.setTopicFilter,
      onFavoriteDragStart: state.setDraggingFavoriteTopic,
      onFavoriteDropTarget: state.setFavoriteDropTarget,
      ...sidebar
    },
    overlay: {
      loading: state.loading,
      isQuickSearchOpen: search.quickSearch.isQuickSearchOpen,
      quickSearchQuery: search.quickSearch.quickSearchQuery,
      quickSearchResults: search.quickSearch.quickSearchResults,
      quickSearchIndex: search.quickSearch.quickSearchIndex,
      connectedServerIds: state.connectedServerIds,
      quickSearchScope: search.quickSearch.quickSearchScope,
      onQuickSearchQuery: search.quickSearch.setQuickSearchQuery,
      onQuickSearchIndex: search.quickSearch.setQuickSearchIndex,
      onCloseQuickSearch: search.quickSearch.closeQuickSearch,
      fontFamily: state.fontFamily,
      fontSize: state.fontSize,
      language: state.language,
      resolvedLanguage: state.resolvedLanguage,
      exportFormatTemplate: state.exportFormatTemplate,
      manualAvroSchemaRows,
      onFontFamily: state.setFontFamily,
      onFontSize: state.setFontSize,
      onLanguage: state.setLanguage,
      onExportFormatTemplate: state.setExportFormatTemplate,
      servers: state.servers,
      manualAvroSchemasByServer: state.manualAvroSchemasByServer,
      topicContextMenu: state.topicContextMenu,
      serverContextMenu: state.serverContextMenu,
      contextTopic,
      contextServer,
      selectedServerId: state.selectedServerId,
      onCloseTopicMenu: state.closeTopicContextMenu,
      onCloseServerMenu: state.closeServerContextMenu,
      onEditServer: state.openEditServerForm,
      ...overlay
    }
  });
}
