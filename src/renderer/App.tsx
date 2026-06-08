import { useShallow } from "zustand/react/shallow";
import { WorkspaceAppLayout } from "./components/workspace/WorkspaceAppLayout";
import { emptyConsumeState } from "./uiTypes";
import {
  useBrokerActions,
  useConsumeActions,
  useConsumerGroupActions,
  useManualAvroSchemaActions,
  useMessageExportActions,
  useProduceActions,
  useSelectedConsumeActions,
  useServerLifecycleActions,
  useSettingsTransferActions,
  useTopicFavorites,
  useTopicMutationActions,
  useTopicResourceActions,
  useTopicRowSelectionActions
} from "./hooks/actions";
import {
  createPrimaryWorkspacePaneProps,
  createSplitWorkspacePaneProps,
  usePrimaryPaneCallbacks,
  useSplitPaneCallbacks,
  useWorkspaceOverlayProps,
  useWorkspaceSidebarProps
} from "./hooks/callbacks";
import {
  useElectronMenuEvents,
  useManualAvroSchemaSummary,
  usePersistedPreferences,
  usePreferenceNavigation
} from "./hooks/preferences";
import {
  useQuickSearchActions,
  useQuickSearchState,
  useServerSearchState,
  useSidebarContextMenus,
  useTopicSearchState
} from "./hooks/search";
import {
  emptyProduceDraft,
  useConsumeStateStore,
  useFeedbackState,
  useKafkaResourceState,
  useLayoutPreferences,
  useProduceDraftStore,
  useServerClusterState,
  useSidebarInteractionState,
  useWorkspacePaneState
} from "./hooks/state";
import {
  useAppKeyboardShortcuts,
  useDismissOnWindowInteraction,
  useServerBootstrap,
  useServerHealthMonitor,
  useSidebarDragActions
} from "./hooks/ui";
import {
  useKafkaConsumeEvents,
  useLiveConsumeRouting,
  usePaneToastRouting,
  usePrimaryTopicNavigationActions,
  usePrimaryTopicTabActions,
  useSelectedServerResources,
  useSelectedServerResourceSetters,
  useServerViewNavigation,
  useSplitPaneActions,
  useSplitPaneViewActions,
  useSplitTopicActivation,
  useSplitTopicDetailActions,
  useTopicDetailCache,
  useTopicViewActions,
  useWorkspaceDragDrop,
  useWorkspaceDragPayloads,
  useWorkspacePaneModels,
  useWorkspaceRefreshActions,
  useWorkspaceSelectors,
  useWorkspaceTasks
} from "./hooks/workspace";
import { useServerFormStore } from "./stores/ui/serverFormStore";
export function App() {
  const kafkaApi = window.kafkaApi;
  const {
    servers,
    setServers,
    connectedServerIds,
    setConnectedServerIds,
    failedServerIds,
    setFailedServerIds,
    setHealthFailuresByServer,
    openClusterIds,
    setOpenClusterIds,
    selectedServerId,
    setSelectedServerId
  } = useServerClusterState();
  const { openNewServerForm, openEditServerForm } = useServerFormStore(useShallow((state) => ({
    openNewServerForm: state.openNewServerForm,
    openEditServerForm: state.openEditServerForm
  })));
  const {
    viewByServer,
    setViewByServer,
    topicViewByServer,
    setTopicViewByServer,
    topicsByServer,
    setTopicsByServer,
    topicGridSortingByServer,
    setTopicGridSortingByServer,
    favoriteTopicsByServer,
    setFavoriteTopicsByServer,
    consumeDefaultsByServer,
    setConsumeDefaultsByServer,
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    preferencesLoaded,
    setPreferencesLoaded,
    selectedTopicByServer,
    setSelectedTopicByServer,
    openedTopicTabsByServer,
    setOpenedTopicTabsByServer,
    topicDetailByServer,
    setTopicDetailByServer,
    topicDetailCacheByServer,
    setTopicDetailCacheByServer,
    brokersByServer,
    setBrokersByServer,
    groupsByServer,
    setGroupsByServer,
    selectedGroupByServer,
    setSelectedGroupByServer,
    groupLagByServer,
    setGroupLagByServer,
    streamingTopicsByServer,
    setStreamingTopicsByServer
  } = useKafkaResourceState();
  const {
    consumeStatesByServer,
    setConsumeStatesByServer,
    splitConsumeStatesByServer,
    setSplitConsumeStatesByServer,
    getDefaultConsumeState,
    setConsumeStates,
    mergeConsumeState,
    moveConsumeStateBetweenPanes,
    clearConsumeStateForPane,
    clearConsumeStatesForPane,
    updateConsumeStateFor
  } = useConsumeStateStore({ selectedServerId, consumeDefaultsByServer });
  const {
    getProduceDraft,
    updateProduceDraftFor,
    resetProduceDrafts
  } = useProduceDraftStore();
  const {
    getMessageTarget,
    setStartedConsumer,
    getStopConsumerId,
    clearStoppedConsumer,
    clearMessageTarget,
    retargetLiveTopic
  } = useLiveConsumeRouting({ setStreamingTopicsByServer });
  const {
    setStatus,
    toast,
    setToast,
    paneToast,
    setPaneToast,
    loading,
    setLoading,
    activeConsumeTaskKeys,
    setActiveConsumeTaskKeys,
    setConnectionError
  } = useFeedbackState();
  const {
    runTask,
    runPaneTask,
    runWorkspaceTask,
    showPaneToast
  } = useWorkspaceTasks({
    setLoading,
    setStatus,
    setToast,
    setPaneToast,
    setActiveConsumeTaskKeys
  });
  const {
    sidebarWidth,
    setSidebarWidth,
    sidebarCollapsed,
    setSidebarCollapsed,
    serverPanelHeight,
    setServerPanelHeight,
    messagePaneHeight,
    setMessagePaneHeight,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    exportFormatTemplate,
    setExportFormatTemplate,
    startSidebarResize,
    startServerPanelResize
  } = useLayoutPreferences();
  useServerBootstrap({
    kafkaApi,
    setStatus,
    setServers,
    setSelectedServerId
  });
  usePersistedPreferences({
    kafkaApi,
    setStatus,
    favoriteTopicsByServer,
    setFavoriteTopicsByServer,
    consumeDefaultsByServer,
    setConsumeDefaultsByServer,
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    preferencesLoaded,
    setPreferencesLoaded,
    sidebarWidth,
    setSidebarWidth,
    sidebarCollapsed,
    setSidebarCollapsed,
    serverPanelHeight,
    setServerPanelHeight,
    messagePaneHeight,
    setMessagePaneHeight,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    exportFormatTemplate,
    setExportFormatTemplate
  });
  useServerHealthMonitor({
    kafkaApi,
    servers,
    connectedServerIds,
    failedServerIds,
    openClusterIds,
    setConnectedServerIds,
    setFailedServerIds,
    setHealthFailuresByServer,
    setStatus,
    setToast
  });
  const {
    openPreferences,
    openPreferencesSection
  } = usePreferenceNavigation();
  const {
    serverContextMenu,
    setServerContextMenu,
    topicContextMenu,
    setTopicContextMenu,
    isTopicSortMenuOpen,
    setIsTopicSortMenuOpen,
    pendingTopicAction,
    setPendingTopicAction,
    topicActionConfirmText,
    setTopicActionConfirmText,
    draggingServerId,
    setDraggingServerId,
    serverDropTarget,
    setServerDropTarget,
    draggingFavoriteTopic,
    setDraggingFavoriteTopic,
    favoriteDropTarget,
    setFavoriteDropTarget,
    closeServerContextMenu,
    closeTopicContextMenu
  } = useSidebarInteractionState();
  useDismissOnWindowInteraction(Boolean(serverContextMenu), closeServerContextMenu);
  useDismissOnWindowInteraction(Boolean(topicContextMenu), closeTopicContextMenu);
  useDismissOnWindowInteraction(isTopicSortMenuOpen, () => setIsTopicSortMenuOpen(false));
  const {
    openManualAvroSchema,
    readSchemaFile,
    saveManualAvroSchema,
    deleteManualAvroSchema,
    deleteManualAvroSchemaFor
  } = useManualAvroSchemaActions({
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    setToast
  });
  const {
    splitPane,
    setSplitPane,
    splitDropSide,
    setSplitDropSide,
    splitPrimaryPercent,
    activeWorkspacePane,
    setActiveWorkspacePane,
    activeDragPayload,
    setActiveDragPayload,
    startWorkspaceSplitResize
  } = useWorkspacePaneState(selectedServerId);
  const { startTopicDrag, startSplitPaneDrag, clearDragPayload } = useWorkspaceDragPayloads({
    setActiveDragPayload,
    setSplitDropSide
  });
  const {
    serverQuery,
    setServerQuery,
    selectedServer,
    contextServer,
    filteredServers
  } = useServerSearchState({
    servers,
    selectedServerId,
    contextServerId: serverContextMenu?.serverId
  });
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
  } = useQuickSearchState({
    servers,
    selectedServerId,
    topicsByServer,
    openedTopicTabsByServer,
    manualAvroSchemasByServer,
    groupsByServer
  });
  const isSelectedServerConnected = connectedServerIds.includes(selectedServerId);
  const topics = topicsByServer[selectedServerId] ?? [];
  const favoriteTopicNames = favoriteTopicsByServer[selectedServerId] ?? [];
  const {
    toggleFavoriteTopic,
    reorderFavoriteTopic
  } = useTopicFavorites({
    selectedServerId,
    setFavoriteTopicsByServer
  });
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
    removeSelectedTopicRowsForServer,
    resetTopicSearchState
  } = useTopicSearchState({ selectedServerId, topics, favoriteTopicNames });
  const {
    toggleTopicRow,
    toggleAllTopicRows,
    copySelectedTopicNames
  } = useTopicRowSelectionActions({
    selectedTopicRows,
    setSelectedTopicRows,
    setToast
  });
  const {
    applyImportedSettings
  } = useSettingsTransferActions({
    kafkaApi,
    setLoading,
    setStatus,
    setToast,
    setServers,
    setFavoriteTopicsByServer,
    setConsumeDefaultsByServer,
    setManualAvroSchemasByServer,
    setSidebarWidth,
    setServerPanelHeight,
    setMessagePaneHeight,
    setFontFamily,
    setFontSize,
    setExportFormatTemplate,
    setConnectedServerIds,
    setFailedServerIds,
    setOpenClusterIds,
    setSelectedServerId,
    setTopicsByServer,
    resetTopicSearchState,
    setSelectedTopicByServer,
    setOpenedTopicTabsByServer,
    setTopicGridSortingByServer,
    setTopicDetailByServer,
    setTopicDetailCacheByServer,
    setBrokersByServer,
    setGroupsByServer,
    setViewByServer,
    setTopicViewByServer,
    setSelectedGroupByServer,
    setGroupLagByServer,
    setConsumeStatesByServer,
    setSplitConsumeStatesByServer,
    resetProduceDrafts,
    setStreamingTopicsByServer
  });
  useElectronMenuEvents({
    kafkaApi,
    openPreferencesSection,
    applyImportedSettings,
    setStatus,
    setToast
  });
  const selectedTopic = selectedTopicByServer[selectedServerId] ?? "";
  const {
    getCachedTopicDetail,
    setTopicDetailForServer
  } = useTopicDetailCache({
    topicDetailCacheByServer,
    setTopicDetailByServer,
    setTopicDetailCacheByServer
  });
  const {
    setTopics,
    setSelectedTopic,
    setOpenedTopicTabs,
    setTopicDetail,
    setGroups
  } = useSelectedServerResourceSetters({
    selectedServerId,
    setTopicsByServer,
    setSelectedTopicByServer,
    setOpenedTopicTabsByServer,
    setTopicDetailForServer,
    setGroupsByServer
  });
  const {
    exportConsumedMessages,
    exportOffsetConditionMessages
  } = useMessageExportActions({
    kafkaApi,
    selectedTopic,
    exportFormatTemplate,
    runTask,
    runPaneTask,
    showPaneToast,
    setLoading,
    setStatus,
    setToast,
    setPaneToast
  });
  const {
    refreshBrokers,
    refreshBrokersForServer
  } = useBrokerActions({
    kafkaApi,
    selectedServerId,
    runTask,
    runWorkspaceTask,
    setBrokersByServer
  });
  const {
    refreshTopicsForServer,
    refreshTopics,
    loadTopicDetail,
    loadTopicDetailSilent
  } = useTopicResourceActions({
    kafkaApi,
    selectedServerId,
    favoriteTopicsByServer,
    selectedTopicByServer,
    clearTopicQueryForServer,
    keepSelectedTopicRowsForServer,
    getCachedTopicDetail,
    setTopicDetailForServer,
    runTask,
    runWorkspaceTask,
    setTopicsByServer,
    setSelectedTopicByServer,
    setTopicDetailByServer,
    setOpenedTopicTabsByServer,
    setConsumeStatesByServer,
    setSplitConsumeStatesByServer
  });
  const view = viewByServer[selectedServerId] ?? (selectedTopic ? "info" : "topics");
  const openedTopicTabs = openedTopicTabsByServer[selectedServerId] ?? [];
  const topicDetail = topicDetailByServer[selectedServerId] ?? null;
  const consumeStates = consumeStatesByServer[selectedServerId] ?? {};
  const selectedDefaultConsumeState = getDefaultConsumeState();
  const {
    startConsume,
    moveOffsetPageFor,
    startConsumeFor,
    stopConsume
  } = useConsumeActions({
    kafkaApi,
    selectedServerId,
    selectedTopic,
    consumeStates,
    selectedDefaultConsumeState,
    runTask,
    runWorkspaceTask,
    updateConsumeStateFor,
    setActiveConsumeTaskKeys,
    setStreamingTopicsByServer,
    setStartedConsumer,
    getStopConsumerId,
    clearStoppedConsumer,
    clearMessageTarget,
    setStatus
  });
  const contextTopic = topicContextMenu?.topic ?? "";
  const visibleSplitPane = splitPane?.serverId === selectedServerId ? splitPane : null;
  const { primaryModel, splitModel } = useWorkspacePaneModels({
    selectedServerId,
    selectedTopic,
    view,
    openedTopicTabs,
    topicDetail,
    visibleSplitPane,
    servers,
    topicsByServer,
    brokersByServer,
    groupsByServer,
    selectedGroupByServer,
    groupLagByServer,
    manualAvroSchemasByServer,
    consumeStatesByServer,
    splitConsumeStatesByServer,
    getDefaultConsumeState
  });
  const splitServer = splitModel?.server;
  const splitConsumeState = splitModel?.consumeState ?? emptyConsumeState;
  const { primaryPaneToast, splitPaneToast } = usePaneToastRouting({
    paneToast,
    toast,
    activeWorkspacePane,
    visibleSplitPane,
    selectedServerId,
    selectedTopic
  });
  const selectedProduceDraft = getProduceDraft(selectedServerId, selectedTopic);
  const splitProduceDraft = visibleSplitPane ? getProduceDraft(visibleSplitPane.serverId, visibleSplitPane.topic) : emptyProduceDraft;
  const {
    loadSplitTopicDetail,
    loadSplitTopicDetailSilent
  } = useSplitTopicDetailActions({
    kafkaApi,
    getCachedTopicDetail,
    runPaneTask,
    setSplitPane,
    setTopicDetailCacheByServer
  });
  const {
    setView,
    setTopicViewFor,
    getTopicViewFor,
    getTopicView,
    activateTopicView,
    activateSelectedTopicView,
    activateSplitSelectedTopicView
  } = useTopicViewActions({
    selectedServerId,
    selectedTopic,
    visibleSplitPane,
    topicViewByServer,
    setViewByServer,
    setTopicViewByServer,
    setSplitPane,
    loadSplitTopicDetailSilent
  });
  const { activateSplitTopic } = useSplitTopicActivation({
    splitPane,
    getTopicViewFor,
    loadSplitTopicDetail,
    setSplitPane,
    setActiveWorkspacePane
  });
  const {
    openServerContextMenu,
    openTopicContextMenu
  } = useSidebarContextMenus({
    setSelectedServerId,
    setServerContextMenu,
    setTopicContextMenu
  });
  const {
    produce,
    produceFor,
    sendMessageToProduce
  } = useProduceActions({
    kafkaApi,
    selectedServerId,
    selectedTopic,
    getProduceDraft,
    updateProduceDraftFor,
    runTask,
    runPaneTask,
    showPaneToast,
    setSplitPane,
    setView,
    setStatus,
    setToast
  });
  const {
    refreshGroups,
    refreshGroupsForServer,
    deleteConsumerGroupsFor,
    loadConsumerGroupLag,
    loadConsumerGroupLagFor
  } = useConsumerGroupActions({
    kafkaApi,
    selectedServerId,
    selectedTopic,
    visibleSplitPane,
    runTask,
    runWorkspaceTask,
    setGroupsByServer,
    setSelectedGroupByServer,
    setGroupLagByServer
  });
  const { showSplitView } = useSplitPaneViewActions({
    splitPane,
    setSplitPane,
    brokersByServer,
    topicsByServer,
    groupsByServer,
    setTopicViewFor,
    loadSplitTopicDetailSilent,
    refreshBrokersForServer,
    refreshTopicsForServer,
    refreshGroupsForServer
  });
  const {
    saveServer,
    deleteServer,
    connectServer,
    openCluster,
    ensureServerConnected,
    disconnectServer,
    closeClusterTab,
    reorderServer
  } = useServerLifecycleActions({
    kafkaApi,
    servers,
    connectedServerIds,
    openClusterIds,
    selectedServerId,
    streamingTopicsByServer,
    runTask,
    stopConsume,
    refreshTopicsForServer,
    refreshBrokersForServer,
    refreshGroupsForServer,
    setServers,
    setSelectedServerId,
    setConnectedServerIds,
    setFailedServerIds,
    setHealthFailuresByServer,
    setOpenClusterIds,
    setOpenedTopicTabs,
    setSelectedTopic,
    setTopicDetail,
    setTopics,
    setGroups,
    setBrokersByServer,
    setConsumeStates,
    setSplitConsumeStatesByServer,
    setViewByServer,
    setTopicViewByServer,
    setStreamingTopicsByServer,
    setConnectionError,
    setToast,
    setStatus
  });
  const {
    handleServerDrop,
    handleServerDragEnd,
    handleFavoriteDrop,
    handleFavoriteDragEnd
  } = useSidebarDragActions({
    reorderServer,
    reorderFavoriteTopic,
    setDraggingServerId,
    setServerDropTarget,
    setActiveDragPayload,
    setSplitDropSide,
    setDraggingFavoriteTopic,
    setFavoriteDropTarget
  });
  const {
    getWorkspaceTargetForServer,
    isTopicStreaming,
    isConsumeTaskActive,
    updateTopicGridSortingForServer,
    getActiveWorkspaceView
  } = useWorkspaceSelectors({
    activeWorkspacePane,
    activeConsumeTaskKeys,
    selectedServerId,
    selectedTopicByServer,
    streamingTopicsByServer,
    visibleSplitPane,
    view,
    setTopicGridSortingByServer
  });
  const { showServerViewInActivePane } = useServerViewNavigation({
    activeWorkspacePane,
    selectedServerId,
    view,
    visibleSplitPane,
    brokersByServer,
    topicsByServer,
    groupsByServer,
    activateSelectedTopicView,
    activateSplitSelectedTopicView,
    refreshBrokers,
    refreshTopics,
    refreshGroups,
    refreshBrokersForServer,
    refreshTopicsForServer,
    refreshGroupsForServer,
    setSplitPane,
    setView
  });
  const {
    selectPrimaryTopic,
    selectTopicInWorkspace,
    openTopicInWorkspace,
    openTopicTab
  } = usePrimaryTopicNavigationActions({
    kafkaApi,
    selectedServerId,
    getWorkspaceTargetForServer,
    getTopicViewFor,
    getCachedTopicDetail,
    setTopicDetailForServer,
    activateSplitTopic,
    loadTopicDetailSilent,
    runWorkspaceTask,
    setActiveWorkspacePane,
    setSelectedServerId,
    setOpenClusterIds,
    setOpenedTopicTabsByServer,
    setSelectedTopicByServer,
    setSelectedTopic,
    setViewByServer,
    setTopicViewByServer
  });
  const {
    openSplitForTopic,
    moveSplitTopicToPrimary,
    removePrimaryTopicTabAfterSplit,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary
  } = useSplitPaneActions({
    kafkaApi,
    selectedServerId,
    selectedTopic,
    openedTopicTabs,
    splitPane,
    splitConsumeStatesByServer,
    topicDetailByServer,
    getTopicViewFor,
    getCachedTopicDetail,
    setTopicDetailForServer,
    isTopicStreaming,
    stopConsume,
    moveConsumeStateBetweenPanes,
    retargetLiveTopic,
    clearConsumeStatesForPane,
    clearConsumeStateForPane,
    loadSplitTopicDetailSilent,
    selectPrimaryTopic,
    setOpenedTopicTabs,
    setSelectedTopic,
    setTopicDetail,
    setSplitPane,
    setActiveWorkspacePane,
    setSelectedServerId,
    setOpenedTopicTabsByServer,
    setSelectedTopicByServer,
    setViewByServer,
    setTopicViewByServer,
    setConsumeStatesByServer,
    setSplitConsumeStatesByServer
  });
  const {
    handleWorkspaceDragOver,
    handleWorkspaceDrop
  } = useWorkspaceDragDrop({
    activeDragPayload,
    setActiveDragPayload,
    setSplitDropSide,
    onCloseSplitPane: closeSplitPane,
    onOpenSplitFromPrimary: async (payload) => {
      await openSplitForTopic(payload.serverId, payload.topic);
      await removePrimaryTopicTabAfterSplit(payload.topic);
    },
    onMoveSplitToPrimary: async (payload) => {
      await moveSplitTopicToPrimary(payload.topic);
    }
  });
  const {
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction
  } = useTopicMutationActions({
    kafkaApi,
    selectedServerId,
    selectedTopic,
    selectedTopicRows,
    selectedTopicByServer,
    topicsByServer,
    splitPane,
    pendingTopicAction,
    topicActionConfirmText,
    runTask,
    stopConsume,
    refreshTopicsForServer,
    loadTopicDetail,
    selectPrimaryTopic,
    removeSelectedTopicRowsForServer,
    setSelectedServerId,
    setPendingTopicAction,
    setTopicActionConfirmText,
    setOpenedTopicTabsByServer,
    setFavoriteTopicsByServer,
    setConsumeStatesByServer,
    setSplitConsumeStatesByServer,
    setTopicViewByServer,
    setTopicDetailCacheByServer,
    setManualAvroSchemasByServer,
    setActiveWorkspacePane,
    setSplitPane,
    setSelectedTopicByServer,
    setTopicDetailByServer,
    setToast
  });

  const { executeQuickSearch } = useQuickSearchActions({
    quickSearchResults,
    quickSearchIndex,
    selectedServerId,
    selectedTopic,
    groupsByServer,
    ensureServerConnected,
    getWorkspaceTargetForServer,
    openTopicInWorkspace,
    openManualAvroSchema,
    openPreferences,
    refreshTopics,
    refreshGroups,
    refreshGroupsForServer,
    loadConsumerGroupLagFor,
    requestTopicAction,
    requestTopicActionFor,
    rememberQuickSearch,
    closeQuickSearch,
    setSelectedServerId,
    setView,
    setViewByServer
  });
  useAppKeyboardShortcuts({
    isQuickSearchOpen,
    quickSearchResultCount: quickSearchResults.length,
    openQuickSearch,
    closeQuickSearch,
    openPreferences,
    setSidebarCollapsed,
    setQuickSearchIndex,
    executeQuickSearch
  });

  const { manualAvroTopicNames, manualAvroSchemaRows } = useManualAvroSchemaSummary(
    manualAvroSchemasByServer,
    servers,
    selectedServerId
  );
  const selectedConsumeState = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;
  const {
    updateSelectedConsumeState,
    updateConsumeDefaults
  } = useSelectedConsumeActions({
    selectedServerId,
    selectedTopic,
    selectedDefaultConsumeState,
    setConsumeStates,
    setConsumeDefaultsByServer
  });
  const {
    refreshCurrentView,
    refreshSplitPaneView,
    refreshActiveWorkspaceView
  } = useWorkspaceRefreshActions({
    activeWorkspacePane,
    selectedServerId,
    selectedTopic,
    view,
    visibleSplitPane,
    splitConsumeState,
    selectedDefaultConsumeState,
    refreshBrokers,
    refreshBrokersForServer,
    refreshTopics,
    refreshTopicsForServer,
    refreshGroups,
    refreshGroupsForServer,
    loadTopicDetail,
    loadTopicDetailSilent,
    loadSplitTopicDetailSilent,
    isTopicStreaming,
    stopConsume,
    getDefaultConsumeState,
    updateSelectedConsumeState,
    updateConsumeStateFor,
    updateProduceDraftFor,
    runPaneTask,
    showPaneToast,
    setGroups,
    setSelectedGroupByServer,
    setGroupLagByServer,
    setStatus
  });

  useKafkaConsumeEvents({
    kafkaApi,
    selectedServerId,
    consumeDefaultsByServer,
    getDefaultConsumeState,
    getMessageTarget,
    mergeConsumeState,
    setConsumeStatesByServer,
    setSplitConsumeStatesByServer,
    setStatus
  });

  useSelectedServerResources({
    selectedServerId,
    connectedServerIds,
    topicsByServer,
    brokersByServer,
    groupsByServer,
    refreshTopics,
    refreshBrokers,
    refreshGroups,
    setTopics,
    setGroups,
    setSelectedTopic,
    setTopicDetail,
    setBrokersByServer
  });

  const { closeTopicTab } = usePrimaryTopicTabActions({
    selectedServerId,
    selectedTopic,
    openedTopicTabs,
    splitPane,
    isTopicStreaming,
    stopConsume,
    clearConsumeStateForPane,
    promoteSplitPaneToPrimary,
    selectPrimaryTopic,
    setOpenedTopicTabs,
    setSelectedTopic,
    setTopicDetail,
    setViewByServer
  });
  const primaryPaneCallbacks = usePrimaryPaneCallbacks({
    selectedServerId,
    selectedTopic,
    selectedConsumeState,
    selectedGroupId: primaryModel.selectedGroupId,
    visibleSplitPane,
    setActiveWorkspacePane,
    setSidebarCollapsed,
    closeClusterTab,
    showServerViewInActivePane,
    refreshActiveWorkspaceView,
    selectTopicInWorkspace,
    closeTopicTab,
    startTopicDrag,
    clearDragPayload,
    setView,
    openManualAvroSchema,
    refreshCurrentView,
    openTopicTab,
    toggleTopicRow,
    toggleAllTopicRows,
    copySelectedTopicNames,
    requestTopicAction,
    toggleFavoriteTopic,
    loadConsumerGroupLag,
    deleteConsumerGroupsFor,
    setSelectedGroupByServer,
    refreshGroupsForServer,
    updateSelectedConsumeState,
    updateConsumeDefaults,
    moveOffsetPageFor,
    startConsume,
    stopConsume,
    sendMessageToProduce,
    exportConsumedMessages,
    exportOffsetConditionMessages,
    updateProduceDraftFor,
    produce
  });
  const splitPaneCallbacks = useSplitPaneCallbacks({
    pane: visibleSplitPane,
    consumeState: splitConsumeState,
    selectedGroupId: splitModel?.selectedGroupId ?? "",
    setActiveWorkspacePane,
    closeSplitPane,
    startSplitPaneDrag,
    clearDragPayload,
    showSplitView,
    activateSplitTopic,
    closeSplitTopicTab,
    startTopicDrag,
    refreshSplitPaneView,
    openManualAvroSchema,
    toggleTopicRow,
    toggleAllTopicRows,
    copySelectedTopicNames,
    requestTopicAction,
    toggleFavoriteTopic,
    loadConsumerGroupLagFor,
    deleteConsumerGroupsFor,
    setSelectedGroupByServer,
    refreshGroupsForServer,
    updateConsumeStateFor,
    moveOffsetPageFor,
    startConsumeFor,
    stopConsume,
    sendMessageToProduce,
    exportConsumedMessages,
    exportOffsetConditionMessages,
    updateProduceDraftFor,
    produceFor
  });
  const activeWorkspaceView = getActiveWorkspaceView();
  const sidebarProps = useWorkspaceSidebarProps({
    serverPanelHeight,
    serverQuery,
    servers,
    filteredServers,
    selectedServerId,
    draggingServerId,
    serverDropTarget,
    connectedServerIds,
    failedServerIds,
    topics,
    filteredTopics,
    favoriteTopics,
    nonFavoriteFilteredTopics,
    favoriteTopicNames,
    manualAvroTopicNames,
    selectedTopic,
    topicQuery,
    topicSearchHistory,
    topicSearchError,
    topicFilter,
    topicSort,
    isTopicSortMenuOpen,
    isSelectedServerConnected,
    loading,
    draggingFavoriteTopic,
    favoriteDropTarget,
    onNewServer: openNewServerForm,
    onServerQuery: setServerQuery,
    onServerSelect: setSelectedServerId,
    onServerContextMenu: openServerContextMenu,
    openCluster,
    onServerDragStart: setDraggingServerId,
    onServerDropTarget: setServerDropTarget,
    onServerDrop: handleServerDrop,
    onServerDragEnd: handleServerDragEnd,
    onServerPanelResize: startServerPanelResize,
    onTopicSortMenuOpen: setIsTopicSortMenuOpen,
    onTopicSort: setTopicSort,
    refreshTopics,
    onTopicQuery: setTopicQuery,
    onCommitTopicSearch: commitTopicSearch,
    onRemoveTopicSearchHistory: removeTopicSearchHistory,
    onTopicFilter: setTopicFilter,
    selectTopicInWorkspace,
    openTopicTab,
    onTopicFavorite: toggleFavoriteTopic,
    onTopicContextMenu: openTopicContextMenu,
    getWorkspaceTargetForTopic: getWorkspaceTargetForServer,
    onFavoriteDragStart: setDraggingFavoriteTopic,
    onFavoriteDropTarget: setFavoriteDropTarget,
    onFavoriteDrop: handleFavoriteDrop,
    onFavoriteDragEnd: handleFavoriteDragEnd
  });
  const primaryPaneProps = createPrimaryWorkspacePaneProps({
    server: selectedServer,
    sidebarCollapsed,
    openClusterIds,
    servers,
    selectedServerId,
    connectedServerIds,
    failedServerIds,
    activeWorkspaceView,
    loading,
    isSelectedServerConnected,
    active: activeWorkspacePane === "primary",
    topicTabs: openedTopicTabs,
    selectedTopic,
    view,
    detail: topicDetail,
    topics: sortedTopics,
    brokers: primaryModel.brokers,
    groups: primaryModel.groups,
    favoriteTopicNames,
    selectedTopics: selectedTopicRows,
    topicSorting: topicGridSortingByServer[selectedServerId] ?? [],
    onTopicSortingChange: (updater) => updateTopicGridSortingForServer(selectedServerId, updater),
    selectedGroupId: primaryModel.selectedGroupId,
    selectedGroupLag: primaryModel.selectedGroupLag,
    groupDetailsById: groupLagByServer[selectedServerId] ?? {},
    consumeState: selectedConsumeState,
    isConsuming: isTopicStreaming(selectedServerId, selectedTopic, "primary"),
    isQuerying: isConsumeTaskActive("primary", selectedServerId, selectedTopic),
    messagePaneHeight: selectedConsumeState.messagePaneHeight ?? messagePaneHeight,
    manualAvroSchemas: manualAvroSchemasByServer[selectedServerId] ?? {},
    produceKey: selectedProduceDraft.key,
    produceHeaders: selectedProduceDraft.headers,
    produceValue: selectedProduceDraft.value,
    paneToast: primaryPaneToast,
    hasAvroSchema: (topic) => manualAvroTopicNames.has(topic),
    onSelectCluster: setSelectedServerId,
    callbacks: primaryPaneCallbacks
  });
  const splitPaneProps = visibleSplitPane && splitServer ? createSplitWorkspacePaneProps({
    pane: visibleSplitPane,
    server: splitServer,
    topics: sortedTopics,
    brokers: splitModel.brokers,
    groups: splitModel.groups,
    favoriteTopicNames,
    selectedTopics: selectedTopicRows,
    topicSorting: topicGridSortingByServer[visibleSplitPane.serverId] ?? [],
    onTopicSortingChange: (updater) => updateTopicGridSortingForServer(visibleSplitPane.serverId, updater),
    selectedGroupId: splitModel.selectedGroupId,
    selectedGroupLag: splitModel.selectedGroupLag,
    groupDetailsById: groupLagByServer[visibleSplitPane.serverId] ?? {},
    consumeState: splitConsumeState,
    isConnected: connectedServerIds.includes(visibleSplitPane.serverId),
    isConsuming: isTopicStreaming(visibleSplitPane.serverId, visibleSplitPane.topic, "split"),
    isQuerying: isConsumeTaskActive("split", visibleSplitPane.serverId, visibleSplitPane.topic),
    messagePaneHeight: splitConsumeState.messagePaneHeight ?? messagePaneHeight,
    active: activeWorkspacePane === "split",
    manualAvroSchemas: manualAvroSchemasByServer[visibleSplitPane.serverId] ?? {},
    produceKey: splitProduceDraft.key,
    produceHeaders: splitProduceDraft.headers,
    produceValue: splitProduceDraft.value,
    paneToast: splitPaneToast,
    callbacks: splitPaneCallbacks
  }) : null;
  const overlayProps = useWorkspaceOverlayProps({
    loading,
    onSaveServer: saveServer,
    isQuickSearchOpen,
    quickSearchQuery,
    quickSearchResults,
    quickSearchIndex,
    connectedServerIds,
    quickSearchScope,
    onQuickSearchQuery: setQuickSearchQuery,
    onQuickSearchIndex: setQuickSearchIndex,
    onCloseQuickSearch: closeQuickSearch,
    onExecuteQuickSearch: (result) => void executeQuickSearch(result),
    fontFamily,
    fontSize,
    exportFormatTemplate,
    manualAvroSchemaRows,
    onFontFamily: setFontFamily,
    onFontSize: setFontSize,
    onExportFormatTemplate: setExportFormatTemplate,
    onOpenManualAvroSchema: openManualAvroSchema,
    onDeleteManualAvroSchemaFor: deleteManualAvroSchemaFor,
    servers,
    manualAvroSchemasByServer,
    onReadSchemaFile: readSchemaFile,
    onDeleteManualAvroSchema: deleteManualAvroSchema,
    onSaveManualAvroSchema: saveManualAvroSchema,
    confirmTopicAction,
    topicContextMenu,
    serverContextMenu,
    contextTopic,
    contextServer,
    selectedServerId,
    onCloseTopicMenu: closeTopicContextMenu,
    openTopicTab,
    copySelectedTopicNames,
    onRegisterAvroSchema: openManualAvroSchema,
    onTopicAction: requestTopicAction,
    onCloseServerMenu: closeServerContextMenu,
    connectServer,
    disconnectServer,
    onEditServer: openEditServerForm,
    deleteServer
  });

  return (
    <WorkspaceAppLayout
      sidebarCollapsed={sidebarCollapsed}
      sidebarWidth={sidebarWidth}
      splitMode={Boolean(visibleSplitPane)}
      splitPrimaryPercent={splitPrimaryPercent}
      splitDropSide={splitDropSide}
      onSidebarResize={startSidebarResize}
      onWorkspaceSplitResize={startWorkspaceSplitResize}
      onWorkspaceDragOver={handleWorkspaceDragOver}
      onWorkspaceDragLeave={() => setSplitDropSide(null)}
      onWorkspaceDrop={(event) => void handleWorkspaceDrop(event)}
      sidebarProps={sidebarProps}
      primaryPaneProps={primaryPaneProps}
      splitPaneProps={splitPaneProps}
      overlayProps={overlayProps}
    />
  );
}
