import {
  useAppSearchComposition,
  useAppStateComposition,
  useAppRuntimeEffects,
  useBrokerTopicResourceActions,
  useConsumerGroupAppActions,
  useConsumeRefreshActions,
  useManualAvroSchemaComposition,
  useMessageFlowActions,
  usePrimaryTopicTabAppActions,
  useQuickSearchAppActions,
  useServerAppActions,
  useSettingsSchemaActions,
  useSplitWorkspaceActions,
  useTopicListActions,
  useTopicOperationActions,
  useWorkspaceChromeCompositions,
  useWorkspaceContextMenuActions,
  useWorkspaceDerivedState,
  useWorkspaceDragComposition,
  useWorkspaceLayoutComposition,
  useWorkspaceMenuDismissals,
  useWorkspaceModelComposition,
  useWorkspaceNavigationComposition,
  useWorkspacePaneCompositions,
  useWorkspaceResourceComposition
} from ".";
export function useWorkspaceAppController() {
  const kafkaApi = window.kafkaApi;
  const appState = useAppStateComposition();
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
  } = appState.serverCluster;
  const { openNewServerForm, openEditServerForm } = appState.serverForms;
  const { openTopicCreateForm, closeTopicCreateForm } = appState.topicCreateForms;
  const resourceState = appState.resources;
  const {
    viewByServer,
    setViewByServer,
    topicViewByServer,
    setTopicViewByServer,
    selectedTopicByServer,
    setSelectedTopicByServer,
    openedTopicTabsByServer,
    setOpenedTopicTabsByServer
  } = resourceState.navigation;
  const {
    topicsByServer,
    setTopicsByServer,
    topicGridSortingByServer,
    setTopicGridSortingByServer,
    favoriteTopicsByServer,
    setFavoriteTopicsByServer,
    topicDetailByServer,
    setTopicDetailByServer,
    topicDetailCacheByServer,
    setTopicDetailCacheByServer
  } = resourceState.topics;
  const {
    brokersByServer,
    setBrokersByServer
  } = resourceState.brokers;
  const {
    groupsByServer,
    setGroupsByServer,
    selectedGroupByServer,
    setSelectedGroupByServer,
    groupLagByServer,
    setGroupLagByServer
  } = resourceState.consumerGroups;
  const {
    consumeDefaultsByServer,
    setConsumeDefaultsByServer,
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    preferencesLoaded,
    setPreferencesLoaded
  } = resourceState.preferences;
  const {
    streamingTopicsByServer,
    setStreamingTopicsByServer
  } = resourceState.streaming;
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
  } = appState.consumeState;
  const {
    getProduceDraft,
    updateProduceDraftFor,
    resetProduceDrafts
  } = appState.produceDrafts;
  const {
    getMessageTarget,
    setStartedConsumer,
    getStopConsumerId,
    clearStoppedConsumer,
    clearMessageTarget,
    retargetLiveTopic
  } = appState.liveConsumeRouting;
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
  } = appState.feedback;
  const {
    runTask,
    runPaneTask,
    runWorkspaceTask,
    showPaneToast
  } = appState.workspaceTasks;
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
    language,
    setLanguage,
    resolvedLanguage,
    exportFormatTemplate,
    setExportFormatTemplate,
    startSidebarResize,
    startServerPanelResize
  } = appState.layout;
  const {
    openPreferences,
    openPreferencesSection
  } = appState.preferences;
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
  } = appState.sidebarInteraction;
  useWorkspaceMenuDismissals({
    serverContextMenuOpen: Boolean(serverContextMenu),
    topicContextMenuOpen: Boolean(topicContextMenu),
    topicSortMenuOpen: isTopicSortMenuOpen,
    closeServerContextMenu,
    closeTopicContextMenu,
    closeTopicSortMenu: () => setIsTopicSortMenuOpen(false)
  });
  const { manualAvroSchemaActions, settingsTransferActions } = useSettingsSchemaActions({
    manualAvroSchema: {
      manualAvroSchemasByServer,
      setManualAvroSchemasByServer,
      setToast
    },
    settingsTransfer: {
      kafkaApi,
      setLoading,
      setStatus,
      setToast
    }
  });
  const {
    openManualAvroSchema,
    readSchemaFile,
    saveManualAvroSchema,
    deleteManualAvroSchema,
    deleteManualAvroSchemaFor
  } = manualAvroSchemaActions;
  const { applyImportedSettings } = settingsTransferActions;
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
  } = appState.workspacePane;
  const appSearch = useAppSearchComposition({
    servers,
    selectedServerId,
    contextServerId: serverContextMenu?.serverId,
    topicsByServer,
    openedTopicTabsByServer,
    manualAvroSchemasByServer,
    groupsByServer,
    connectedServerIds,
    favoriteTopicsByServer
  });
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
  const { favoriteActions, rowSelectionActions } = useTopicListActions({
    favorites: {
      selectedServerId,
      setFavoriteTopicsByServer
    },
    rowSelection: {
      selectedTopicRows,
      setSelectedTopicRows,
      setToast
    }
  });
  const { toggleFavoriteTopic, reorderFavoriteTopic } = favoriteActions;
  const { toggleTopicRow, toggleAllTopicRows, copySelectedTopicNames } = rowSelectionActions;
  const selectedTopic = selectedTopicByServer[selectedServerId] ?? "";
  const { topicDetailCacheActions, selectedServerResourceSetters } = useWorkspaceResourceComposition({
    topicDetailCache: {
      topicDetailCacheByServer,
      setTopicDetailByServer,
      setTopicDetailCacheByServer
    },
    selectedServerResources: {
      selectedServerId,
      setTopicsByServer,
      setSelectedTopicByServer,
      setOpenedTopicTabsByServer,
      setGroupsByServer
    }
  });
  const { getCachedTopicDetail, setTopicDetailForServer } = topicDetailCacheActions;
  const {
    setTopics,
    setSelectedTopic,
    setOpenedTopicTabs,
    setTopicDetail,
    setGroups
  } = selectedServerResourceSetters;
  const { brokerActions, topicActions } = useBrokerTopicResourceActions({
    brokers: {
      kafkaApi,
      selectedServerId,
      runTask,
      runWorkspaceTask,
      setBrokersByServer
    },
    topics: {
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
    }
  });
  const { refreshBrokers, refreshBrokersForServer } = brokerActions;
  const { refreshTopicsForServer, refreshTopics, loadTopicDetail, loadTopicDetailSilent } = topicActions;
  const {
    view,
    openedTopicTabs,
    topicDetail,
    consumeStates,
    selectedDefaultConsumeState,
    visibleSplitPane,
    selectedProduceDraft,
    splitProduceDraft
  } = useWorkspaceDerivedState({
    selectedServerId,
    selectedTopicByServer,
    viewByServer,
    openedTopicTabsByServer,
    topicDetailByServer,
    consumeStatesByServer,
    splitPane,
    getDefaultConsumeState,
    getProduceDraft
  });
  const contextTopic = topicContextMenu?.topic ?? "";
  const {
    primaryModel,
    splitModel,
    splitServer,
    splitConsumeState,
    primaryPaneToast,
    splitPaneToast,
    getWorkspaceTargetForServer,
    isTopicStreaming,
    isConsumeTaskActive,
    updateTopicGridSortingForServer,
    getActiveWorkspaceView
  } = useWorkspaceModelComposition({
    paneModels: {
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
    },
    paneToastRouting: {
      paneToast,
      toast,
      activeWorkspacePane,
      visibleSplitPane,
      selectedServerId,
      selectedTopic
    },
    selectors: {
      activeWorkspacePane,
      activeConsumeTaskKeys,
      selectedServerId,
      selectedTopicByServer,
      streamingTopicsByServer,
      visibleSplitPane,
      view,
      setTopicGridSortingByServer
    }
  });
  const {
    openServerContextMenu,
    openTopicContextMenu
  } = useWorkspaceContextMenuActions({
    setSelectedServerId,
    setServerContextMenu,
    setTopicContextMenu
  });
  const {
    refreshGroups,
    refreshGroupsForServer,
    deleteConsumerGroupsFor,
    loadConsumerGroupLag,
    loadConsumerGroupLagFor
  } = useConsumerGroupAppActions({
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
  const {
    splitTopicDetailActions,
    topicViewActions,
    splitTopicActivationActions,
    serverViewActions,
    primaryTopicNavigationActions
  } = useWorkspaceNavigationComposition({
    splitTopicDetail: {
      kafkaApi,
      getCachedTopicDetail,
      runPaneTask,
      setSplitPane,
      setTopicDetailCacheByServer
    },
    topicView: {
      selectedServerId,
      selectedTopic,
      visibleSplitPane,
      topicViewByServer,
      setViewByServer,
      setTopicViewByServer,
      setSplitPane
    },
    splitTopicActivation: {
      splitPane,
      setSplitPane,
      setActiveWorkspacePane
    },
    serverView: {
      activeWorkspacePane,
      selectedServerId,
      view,
      visibleSplitPane,
      brokersByServer,
      topicsByServer,
      groupsByServer,
      refreshBrokers,
      refreshTopics,
      refreshGroups,
      refreshBrokersForServer,
      refreshTopicsForServer,
      refreshGroupsForServer,
      setSplitPane
    },
    primaryTopicNavigation: {
      kafkaApi,
      selectedServerId,
      getWorkspaceTargetForServer,
      getCachedTopicDetail,
      setTopicDetailForServer,
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
    }
  });
  const {
    setView,
    setTopicViewFor,
    getTopicViewFor,
    getTopicView,
    activateTopicView,
    activateSelectedTopicView,
    activateSplitSelectedTopicView
  } = topicViewActions;
  const { loadSplitTopicDetailSilent } = splitTopicDetailActions;
  const { activateSplitTopic } = splitTopicActivationActions;
  const { showServerViewInActivePane } = serverViewActions;
  const {
    selectPrimaryTopic,
    selectTopicInWorkspace,
    openTopicInWorkspace,
    openTopicTab
  } = primaryTopicNavigationActions;
  const { consumeActions, exportActions, produceActions } = useMessageFlowActions({
    consume: {
      kafkaApi,
      selectedServerId,
      selectedTopic,
      consumeStates,
      selectedDefaultConsumeState,
      runWorkspaceTask,
      updateConsumeStateFor,
      setActiveConsumeTaskKeys,
      setStreamingTopicsByServer,
      setStartedConsumer,
      getStopConsumerId,
      clearStoppedConsumer,
      clearMessageTarget,
      setStatus
    },
    exportMessages: {
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
    },
    produce: {
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
    }
  });
  const { startConsume, moveOffsetPageFor, startConsumeFor, stopConsume } = consumeActions;
  const { exportConsumedMessages, exportOffsetConditionMessages } = exportActions;
  const { produce, produceFor, sendMessageToProduce } = produceActions;
  const { lifecycleActions, sidebarDragActions } = useServerAppActions({
    lifecycle: {
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
    },
    sidebarDrag: {
      reorderFavoriteTopic,
      setDraggingServerId,
      setServerDropTarget,
      setActiveDragPayload,
      setSplitDropSide,
      setDraggingFavoriteTopic,
      setFavoriteDropTarget
    }
  });
  const {
    saveServer,
    deleteServer,
    connectServer,
    openCluster,
    ensureServerConnected,
    disconnectServer,
    closeClusterTab
  } = lifecycleActions;
  const {
    handleServerDrop,
    handleServerDragEnd,
    handleFavoriteDrop,
    handleFavoriteDragEnd
  } = sidebarDragActions;
  const { viewActions: splitViewActions, paneActions: splitPaneActions } = useSplitWorkspaceActions({
    view: {
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
    },
    pane: {
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
    }
  });
  const { showSplitView } = splitViewActions;
  const {
    openSplitForTopic,
    moveSplitTopicToPrimary,
    removePrimaryTopicTabAfterSplit,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary
  } = splitPaneActions;
  const { payloadActions, dropActions } = useWorkspaceDragComposition({
    payloads: {
      setActiveDragPayload,
      setSplitDropSide
    },
    drop: {
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
    }
  });
  const { startTopicDrag, startSplitPaneDrag, clearDragPayload } = payloadActions;
  const { handleWorkspaceDragOver, handleWorkspaceDrop } = dropActions;  const {
    createTopic,
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction
  } = useTopicOperationActions({
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

  async function submitTopicCreate(form: Parameters<typeof createTopic>[0]) {
    await createTopic(form);
    closeTopicCreateForm();
  }

  const { executeQuickSearch } = useQuickSearchAppActions({
    actions: {
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
    },
    shortcuts: {
      isQuickSearchOpen,
      quickSearchResultCount: quickSearchResults.length,
      openQuickSearch,
      closeQuickSearch,
      openPreferences,
      setSidebarCollapsed,
      setQuickSearchIndex
    }
  });

  const { manualAvroTopicNames, manualAvroSchemaRows } = useManualAvroSchemaComposition({
    manualAvroSchemasByServer,
    servers,
    selectedServerId
  });
  const selectedConsumeState = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;
  const { selectedConsumeActions, refreshActions } = useConsumeRefreshActions({
    selectedConsume: {
      selectedServerId,
      selectedTopic,
      selectedDefaultConsumeState,
      setConsumeStates,
      setConsumeDefaultsByServer
    },
    workspaceRefresh: {
      activeWorkspacePane,
      selectedServerId,
      selectedTopic,
      view,
      visibleSplitPane,
      selectedConsumeState,
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
      updateConsumeStateFor,
      updateProduceDraftFor,
      runPaneTask,
      showPaneToast,
      setGroups,
      setSelectedGroupByServer,
      setGroupLagByServer,
      setStatus
    }
  });
  const { updateSelectedConsumeState, updateConsumeDefaults } = selectedConsumeActions;
  const { refreshCurrentView, refreshSplitPaneView, refreshActiveWorkspaceView } = refreshActions;

  useAppRuntimeEffects({
    serverBootstrap: {
      kafkaApi,
      setStatus,
      setServers,
      setSelectedServerId
    },
    persistedPreferences: {
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
      language,
      setLanguage,
      exportFormatTemplate,
      setExportFormatTemplate
    },
    serverHealthMonitor: {
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
    },
    electronMenuEvents: {
      kafkaApi,
      language: resolvedLanguage,
      openPreferencesSection,
      applyImportedSettings,
      setStatus,
      setToast
    },
    kafkaConsumeEvents: {
      kafkaApi,
      selectedServerId,
      consumeDefaultsByServer,
      getDefaultConsumeState,
      getMessageTarget,
      mergeConsumeState,
      setConsumeStatesByServer,
      setSplitConsumeStatesByServer,
      setStatus
    },
    selectedServerResources: {
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
    }
  });

  const { closeTopicTab } = usePrimaryTopicTabAppActions({
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
  const activeWorkspaceView = getActiveWorkspaceView();
  const { sidebarProps, overlayProps } = useWorkspaceChromeCompositions({
    sidebar: {
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
    },
    overlay: {
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
      language,
      resolvedLanguage,
      exportFormatTemplate,
      manualAvroSchemaRows,
      onFontFamily: setFontFamily,
      onFontSize: setFontSize,
      onLanguage: setLanguage,
      onExportFormatTemplate: setExportFormatTemplate,
      onOpenManualAvroSchema: openManualAvroSchema,
      onDeleteManualAvroSchemaFor: deleteManualAvroSchemaFor,
      servers,
      manualAvroSchemasByServer,
      onReadSchemaFile: readSchemaFile,
      onDeleteManualAvroSchema: deleteManualAvroSchema,
      onSaveManualAvroSchema: saveManualAvroSchema,
      onCreateTopic: submitTopicCreate,
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
    }
  });
  const { primaryPaneProps, splitPaneProps } = useWorkspacePaneCompositions({
    primaryCallbacks: {
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
      openTopicCreateForm,
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
    },
    primaryPane: {
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
      language: resolvedLanguage,
      hasAvroSchema: (topic) => manualAvroTopicNames.has(topic),
      onSelectCluster: setSelectedServerId
    },
    splitCallbacks: {
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
      openTopicCreateForm,
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
    },
    splitPane: visibleSplitPane && splitServer && splitModel ? {
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
      language: resolvedLanguage
    } : null
  });
  const workspaceLayoutProps = useWorkspaceLayoutComposition({
    sidebarCollapsed,
    sidebarWidth,
    splitMode: Boolean(visibleSplitPane),
    splitPrimaryPercent,
    splitDropSide,
    onSidebarResize: startSidebarResize,
    onWorkspaceSplitResize: startWorkspaceSplitResize,
    onWorkspaceDragOver: handleWorkspaceDragOver,
    onWorkspaceDragLeave: () => setSplitDropSide(null),
    onWorkspaceDrop: (event) => void handleWorkspaceDrop(event),
    sidebarProps,
    primaryPaneProps,
    splitPaneProps,
    overlayProps
  });

  return workspaceLayoutProps;
}
