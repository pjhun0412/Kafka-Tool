import type { useWorkspaceChromeCompositions } from "../layout/useWorkspaceChromeCompositions";
import type { ViewerPreferences } from "../../../viewerPreferences";

export type ChromeSidebarProps = Parameters<typeof useWorkspaceChromeCompositions>[0]["sidebar"];
export type ChromeOverlayProps = Parameters<typeof useWorkspaceChromeCompositions>[0]["overlay"];

export type ControllerChromeState = Pick<
  ChromeSidebarProps,
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
> &
  Pick<
    ChromeOverlayProps,
    | "fontFamily"
    | "fontSize"
    | "fontWeight"
    | "language"
    | "resolvedLanguage"
    | "exportFormatTemplate"
    | "consumeDefaults"
    | "logRetentionDays"
    | "keyboardShortcuts"
    | "appVersion"
    | "manualAvroSchemasByServer"
    | "topicContextMenu"
    | "serverContextMenu"
  > & {
    closeServerContextMenu: ChromeOverlayProps["onCloseServerMenu"];
    closeTopicContextMenu: ChromeOverlayProps["onCloseTopicMenu"];
    openEditServerForm: ChromeOverlayProps["onEditServer"];
    openNewServerForm: ChromeSidebarProps["onNewServer"];
    setDraggingFavoriteTopic: ChromeSidebarProps["onFavoriteDragStart"];
    setDraggingServerId: ChromeSidebarProps["onServerDragStart"];
    setExportFormatTemplate: ChromeOverlayProps["onExportFormatTemplate"];
    setConsumeDefaults: ChromeOverlayProps["onConsumeDefaults"];
    viewerPreferences: Required<ViewerPreferences>;
    setViewerPreferences: (
      value: Required<ViewerPreferences> | ((current: Required<ViewerPreferences>) => Required<ViewerPreferences>)
    ) => void;
    setFavoriteDropTarget: ChromeSidebarProps["onFavoriteDropTarget"];
    setFontFamily: ChromeOverlayProps["onFontFamily"];
    setFontSize: ChromeOverlayProps["onFontSize"];
    setFontWeight: ChromeOverlayProps["onFontWeight"];
    setIsTopicSortMenuOpen: ChromeSidebarProps["onTopicSortMenuOpen"];
    setLanguage: ChromeOverlayProps["onLanguage"];
    setKeyboardShortcuts: ChromeOverlayProps["onKeyboardShortcuts"];
    setLogRetentionDays: ChromeOverlayProps["onLogRetentionDays"];
    setLastSeenReleaseVersion: ChromeOverlayProps["onLastSeenReleaseVersion"];
    setSelectedServerId: ChromeSidebarProps["onServerSelect"];
    setServerDropTarget: ChromeSidebarProps["onServerDropTarget"];
    startServerPanelResize: ChromeSidebarProps["onServerPanelResize"];
  };

export type ControllerChromeSearch = {
  serverSearch: Pick<ChromeSidebarProps, "serverQuery" | "filteredServers"> & {
    setServerQuery: ChromeSidebarProps["onServerQuery"];
  };
  topicSearch: Pick<
    ChromeSidebarProps,
    | "filteredTopics"
    | "favoriteTopics"
    | "nonFavoriteFilteredTopics"
    | "topicQuery"
    | "topicSearchHistory"
    | "topicSearchError"
    | "topicFilter"
    | "topicSort"
  > & {
    setTopicFilter: ChromeSidebarProps["onTopicFilter"];
    setTopicQuery: ChromeSidebarProps["onTopicQuery"];
    setTopicSort: ChromeSidebarProps["onTopicSort"];
  };
  quickSearch: Pick<
    ChromeOverlayProps,
    | "isQuickSearchOpen"
    | "quickSearchQuery"
    | "quickSearchResults"
    | "quickSearchIndex"
    | "quickSearchScope"
  > & {
    closeQuickSearch: ChromeOverlayProps["onCloseQuickSearch"];
    setQuickSearchIndex: ChromeOverlayProps["onQuickSearchIndex"];
    setQuickSearchQuery: ChromeOverlayProps["onQuickSearchQuery"];
  };
  isSelectedServerConnected: ChromeSidebarProps["isSelectedServerConnected"];
  topics: ChromeSidebarProps["topics"];
  favoriteTopicNames: ChromeSidebarProps["favoriteTopicNames"];
  selectedTopic: ChromeSidebarProps["selectedTopic"];
};

export type WorkspaceControllerChromeParams = {
  state: ControllerChromeState;
  search: ControllerChromeSearch;
  sidebar: Pick<
    ChromeSidebarProps,
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
    ChromeOverlayProps,
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
  manualAvroSchemaRows: ChromeOverlayProps["manualAvroSchemaRows"];
  manualAvroTopicNames: ChromeSidebarProps["manualAvroTopicNames"];
  contextTopic: ChromeOverlayProps["contextTopic"];
  contextServer: ChromeOverlayProps["contextServer"];
};
