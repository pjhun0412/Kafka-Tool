import type { ChromeOverlayProps, WorkspaceControllerChromeParams } from "../workspaceControllerChromeTypes";

export function createOverlayChromeComposition({
  state,
  search,
  overlay,
  manualAvroSchemaRows,
  contextTopic,
  contextServer
}: WorkspaceControllerChromeParams): ChromeOverlayProps {
  return {
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
    consumeDefaults: state.consumeDefaults,
    viewerPreferenceRetentionDays: state.viewerPreferences.retentionDays,
    logRetentionDays: state.logRetentionDays,
    keyboardShortcuts: state.keyboardShortcuts,
    appVersion: state.appVersion,
    manualAvroSchemaRows,
    onFontFamily: state.setFontFamily,
    onFontSize: state.setFontSize,
    onLanguage: state.setLanguage,
    onExportFormatTemplate: state.setExportFormatTemplate,
    onConsumeDefaults: state.setConsumeDefaults,
    onViewerPreferenceRetentionDays: (retentionDays) => state.setViewerPreferences((current) => ({
      ...current,
      retentionDays
    })),
    onLogRetentionDays: state.setLogRetentionDays,
    onKeyboardShortcuts: state.setKeyboardShortcuts,
    onLastSeenReleaseVersion: state.setLastSeenReleaseVersion,
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
  };
}
