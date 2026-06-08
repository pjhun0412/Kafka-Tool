import {
  WorkspaceAppLayout,
  type WorkspaceAppLayoutOverlayProps,
  type WorkspaceAppLayoutPrimaryPaneProps,
  type WorkspaceAppLayoutSidebarProps,
  type WorkspaceAppLayoutSplitPaneProps
} from "./components/workspace/WorkspaceAppLayout";
import { emptyConsumeState } from "./uiTypes";
import { useTopicSearchState } from "./hooks/useTopicSearchState";
import { usePreferenceNavigation } from "./hooks/usePreferenceNavigation";
import { useServerSearchState } from "./hooks/useServerSearchState";
import { useConsumeStateStore } from "./hooks/useConsumeStateStore";
import { useQuickSearchState } from "./hooks/useQuickSearchState";
import { useQuickSearchActions } from "./hooks/useQuickSearchActions";
import { emptyProduceDraft, useProduceDraftStore } from "./hooks/useProduceDraftStore";
import { useLayoutPreferences } from "./hooks/useLayoutPreferences";
import { useWorkspacePaneState } from "./hooks/useWorkspacePaneState";
import { useSidebarInteractionState } from "./hooks/useSidebarInteractionState";
import { useManualAvroSchemaActions } from "./hooks/useManualAvroSchemaActions";
import { useFeedbackState } from "./hooks/useFeedbackState";
import { useServerClusterState } from "./hooks/useServerClusterState";
import { useKafkaResourceState } from "./hooks/useKafkaResourceState";
import { useDismissOnWindowInteraction } from "./hooks/useDismissOnWindowInteraction";
import { useAppKeyboardShortcuts } from "./hooks/useAppKeyboardShortcuts";
import { useServerBootstrap } from "./hooks/useServerBootstrap";
import { usePersistedPreferences } from "./hooks/usePersistedPreferences";
import { useWorkspaceTasks } from "./hooks/useWorkspaceTasks";
import { useTopicFavorites } from "./hooks/useTopicFavorites";
import { useServerHealthMonitor } from "./hooks/useServerHealthMonitor";
import { useElectronMenuEvents } from "./hooks/useElectronMenuEvents";
import { useTopicRowSelectionActions } from "./hooks/useTopicRowSelectionActions";
import { useSettingsTransferActions } from "./hooks/useSettingsTransferActions";
import { useMessageExportActions } from "./hooks/useMessageExportActions";
import { useProduceActions } from "./hooks/useProduceActions";
import { useConsumerGroupActions } from "./hooks/useConsumerGroupActions";
import { useBrokerActions } from "./hooks/useBrokerActions";
import { useTopicDetailCache } from "./hooks/useTopicDetailCache";
import { useTopicViewActions } from "./hooks/useTopicViewActions";
import { useTopicResourceActions } from "./hooks/useTopicResourceActions";
import { usePaneToastRouting } from "./hooks/usePaneToastRouting";
import { useWorkspacePaneModels } from "./hooks/useWorkspacePaneModels";
import { useLiveConsumeRouting } from "./hooks/useLiveConsumeRouting";
import { useWorkspaceDragDrop } from "./hooks/useWorkspaceDragDrop";
import { useWorkspaceDragPayloads } from "./hooks/useWorkspaceDragPayloads";
import { useSelectedServerResourceSetters } from "./hooks/useSelectedServerResourceSetters";
import { useManualAvroSchemaSummary } from "./hooks/useManualAvroSchemaSummary";
import { useServerLifecycleActions } from "./hooks/useServerLifecycleActions";
import { useKafkaConsumeEvents } from "./hooks/useKafkaConsumeEvents";
import { useSelectedServerResources } from "./hooks/useSelectedServerResources";
import { useTopicMutationActions } from "./hooks/useTopicMutationActions";
import { useSidebarContextMenus } from "./hooks/useSidebarContextMenus";
import { useSelectedConsumeActions } from "./hooks/useSelectedConsumeActions";
import { useWorkspaceSelectors } from "./hooks/useWorkspaceSelectors";
import { useServerViewNavigation } from "./hooks/useServerViewNavigation";
import { useWorkspaceRefreshActions } from "./hooks/useWorkspaceRefreshActions";
import { usePrimaryTopicNavigationActions } from "./hooks/usePrimaryTopicNavigationActions";
import { useSplitTopicDetailActions } from "./hooks/useSplitTopicDetailActions";
import { useSplitPaneActions } from "./hooks/useSplitPaneActions";
import { useSplitPaneViewActions } from "./hooks/useSplitPaneViewActions";
import { usePrimaryTopicTabActions } from "./hooks/usePrimaryTopicTabActions";
import { useConsumeActions } from "./hooks/useConsumeActions";
import { useSplitTopicActivation } from "./hooks/useSplitTopicActivation";
import { useSidebarDragActions } from "./hooks/useSidebarDragActions";
import { usePrimaryPaneCallbacks } from "./hooks/usePrimaryPaneCallbacks";
import { useSplitPaneCallbacks } from "./hooks/useSplitPaneCallbacks";
import { useWorkspaceOverlayCallbacks } from "./hooks/useWorkspaceOverlayCallbacks";
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
  const openNewServerForm = useServerFormStore((state) => state.openNewServerForm);
  const openEditServerForm = useServerFormStore((state) => state.openEditServerForm);
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
  } = useWorkspacePaneState();
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
    activateTopicView,
    setSelectedServerId,
    setSelectedTopic,
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
  const overlayCallbacks = useWorkspaceOverlayCallbacks({
    confirmTopicAction,
    openTopicTab,
    copySelectedTopicNames,
    connectServer,
    disconnectServer,
    deleteServer
  });

  const activeWorkspaceView = getActiveWorkspaceView();
  const sidebarProps = {
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
    onOpenServer: (server) => void openCluster(server),
    onServerDragStart: setDraggingServerId,
    onServerDropTarget: setServerDropTarget,
    onServerDrop: handleServerDrop,
    onServerDragEnd: handleServerDragEnd,
    onServerPanelResize: startServerPanelResize,
    onTopicSortMenuOpen: setIsTopicSortMenuOpen,
    onTopicSort: setTopicSort,
    onRefreshTopics: () => void refreshTopics(),
    onTopicQuery: setTopicQuery,
    onCommitTopicSearch: commitTopicSearch,
    onRemoveTopicSearchHistory: removeTopicSearchHistory,
    onTopicFilter: setTopicFilter,
    onTopicSelect: (target, topic) => void selectTopicInWorkspace(target, topic),
    onTopicOpen: (topic) => void openTopicTab(topic),
    onTopicFavorite: toggleFavoriteTopic,
    onTopicContextMenu: openTopicContextMenu,
    getWorkspaceTargetForTopic: getWorkspaceTargetForServer,
    onFavoriteDragStart: setDraggingFavoriteTopic,
    onFavoriteDropTarget: setFavoriteDropTarget,
    onFavoriteDrop: handleFavoriteDrop,
    onFavoriteDragEnd: handleFavoriteDragEnd
  } satisfies WorkspaceAppLayoutSidebarProps;
  const primaryPaneProps = {
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
    onActivate: primaryPaneCallbacks.activate,
    onToggleSidebar: primaryPaneCallbacks.toggleSidebar,
    onSelectCluster: setSelectedServerId,
    onCloseCluster: primaryPaneCallbacks.closeCluster,
    onServerView: primaryPaneCallbacks.serverView,
    onRefreshServerView: primaryPaneCallbacks.refreshServerView,
    onTopic: primaryPaneCallbacks.selectTopic,
    onCloseTopic: primaryPaneCallbacks.closeTopic,
    onTopicDragStart: primaryPaneCallbacks.topicDragStart,
    onTopicDragEnd: primaryPaneCallbacks.topicDragEnd,
    onTopicView: primaryPaneCallbacks.topicView,
    onOpenSchema: primaryPaneCallbacks.openSchema,
    onRefreshTopicView: primaryPaneCallbacks.refreshTopicView,
    onOpenTopic: primaryPaneCallbacks.openTopic,
    onSelectTopic: primaryPaneCallbacks.selectTopicFromTable,
    onToggleTopicSelected: primaryPaneCallbacks.toggleTopicSelected,
    onToggleAllTopicsSelected: primaryPaneCallbacks.toggleAllTopicsSelected,
    onCopySelectedTopics: primaryPaneCallbacks.copySelectedTopics,
    onPurgeSelectedTopics: primaryPaneCallbacks.purgeSelectedTopics,
    onDeleteSelectedTopics: primaryPaneCallbacks.deleteSelectedTopics,
    onToggleTopicFavorite: primaryPaneCallbacks.toggleTopicFavorite,
    onSelectGroup: primaryPaneCallbacks.selectGroup,
    onDeleteConsumerGroups: primaryPaneCallbacks.deleteConsumerGroups,
    onBackGroup: primaryPaneCallbacks.backGroup,
    onRefreshGroups: primaryPaneCallbacks.refreshGroups,
    onRefreshGroupDetail: primaryPaneCallbacks.refreshGroupDetail,
    onUpdateConsume: primaryPaneCallbacks.updateConsume,
    onOffsetOrder: primaryPaneCallbacks.offsetOrder,
    onOffsetPage: primaryPaneCallbacks.offsetPage,
    onStartConsume: primaryPaneCallbacks.startConsume,
    onStopConsume: primaryPaneCallbacks.stopConsume,
    onSendToProduce: primaryPaneCallbacks.sendToProduce,
    onExport: primaryPaneCallbacks.exportMessages,
    onExportAll: primaryPaneCallbacks.exportAll,
    onMessagePaneHeight: primaryPaneCallbacks.messagePaneHeight,
    onProduceKey: primaryPaneCallbacks.produceKey,
    onProduceHeaders: primaryPaneCallbacks.produceHeaders,
    onProduceValue: primaryPaneCallbacks.produceValue,
    onProduce: primaryPaneCallbacks.produce
  } satisfies WorkspaceAppLayoutPrimaryPaneProps;
  const splitPaneProps = visibleSplitPane && splitServer ? {
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
    onClose: splitPaneCallbacks.close,
    active: activeWorkspacePane === "split",
    onActivate: splitPaneCallbacks.activate,
    onDragStart: splitPaneCallbacks.dragStart,
    onDragEnd: splitPaneCallbacks.dragEnd,
    onView: splitPaneCallbacks.view,
    onTopic: splitPaneCallbacks.selectTopic,
    onOpenTopic: splitPaneCallbacks.openTopic,
    onCloseTopic: splitPaneCallbacks.closeTopic,
    onTopicDragStart: splitPaneCallbacks.topicDragStart,
    onTopicDragEnd: splitPaneCallbacks.topicDragEnd,
    onRefresh: splitPaneCallbacks.refresh,
    onOpenSchema: splitPaneCallbacks.openSchema,
    manualAvroSchemas: manualAvroSchemasByServer[visibleSplitPane.serverId] ?? {},
    onToggleTopicSelected: splitPaneCallbacks.toggleTopicSelected,
    onToggleAllTopicsSelected: splitPaneCallbacks.toggleAllTopicsSelected,
    onCopySelectedTopics: splitPaneCallbacks.copySelectedTopics,
    onPurgeSelectedTopics: splitPaneCallbacks.purgeSelectedTopics,
    onDeleteSelectedTopics: splitPaneCallbacks.deleteSelectedTopics,
    onToggleTopicFavorite: splitPaneCallbacks.toggleTopicFavorite,
    onSelectGroup: splitPaneCallbacks.selectGroup,
    onDeleteConsumerGroups: splitPaneCallbacks.deleteConsumerGroups,
    onBackGroup: splitPaneCallbacks.backGroup,
    onRefreshGroups: splitPaneCallbacks.refreshGroups,
    onRefreshGroupDetail: splitPaneCallbacks.refreshGroupDetail,
    onUpdateConsume: splitPaneCallbacks.updateConsume,
    onOffsetOrder: splitPaneCallbacks.offsetOrder,
    onOffsetPage: splitPaneCallbacks.offsetPage,
    onStartConsume: splitPaneCallbacks.startConsume,
    onStopConsume: splitPaneCallbacks.stopConsume,
    onSendToProduce: splitPaneCallbacks.sendToProduce,
    onExport: splitPaneCallbacks.exportMessages,
    onExportAll: splitPaneCallbacks.exportAll,
    onMessagePaneHeight: splitPaneCallbacks.messagePaneHeight,
    produceKey: splitProduceDraft.key,
    produceHeaders: splitProduceDraft.headers,
    produceValue: splitProduceDraft.value,
    onProduceKey: splitPaneCallbacks.produceKey,
    onProduceHeaders: splitPaneCallbacks.produceHeaders,
    onProduceValue: splitPaneCallbacks.produceValue,
    onProduce: splitPaneCallbacks.produce,
    paneToast: splitPaneToast
  } satisfies WorkspaceAppLayoutSplitPaneProps : null;
  const overlayProps = {
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
    onConfirmTopicAction: overlayCallbacks.confirmTopicAction,
    topicContextMenu,
    serverContextMenu,
    contextTopic,
    contextServer,
    selectedServerId,
    onCloseTopicMenu: closeTopicContextMenu,
    onOpenTopic: overlayCallbacks.openTopic,
    onCopyTopic: overlayCallbacks.copyTopic,
    onRegisterAvroSchema: openManualAvroSchema,
    onTopicAction: requestTopicAction,
    onCloseServerMenu: closeServerContextMenu,
    onConnectServer: overlayCallbacks.connectServer,
    onDisconnectServer: overlayCallbacks.disconnectServer,
    onEditServer: openEditServerForm,
    onDeleteServer: overlayCallbacks.deleteServer
  } satisfies WorkspaceAppLayoutOverlayProps;

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
