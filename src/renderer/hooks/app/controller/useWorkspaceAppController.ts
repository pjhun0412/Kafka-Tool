import { useConsumerGroupAppActions } from "../actions/useConsumerGroupAppActions";
import { useMessageFlowActions } from "../actions/useMessageFlowActions";
import { useWorkspaceContextMenuActions } from "../actions/useWorkspaceContextMenuActions";
import { useWorkspaceDerivedState } from "../state/useWorkspaceDerivedState";
import { useWorkspaceModelComposition } from "../workspace/useWorkspaceModelComposition";
import { useWorkspacePaneCompositions } from "../workspace/useWorkspacePaneCompositions";
import { useWorkspaceControllerChrome } from "./useWorkspaceControllerChrome";
import { useWorkspaceControllerLayout } from "./useWorkspaceControllerLayout";
import { useWorkspaceControllerNavigation } from "./useWorkspaceControllerNavigation";
import { useWorkspaceControllerInteractions } from "./useWorkspaceControllerInteractions";
import { useWorkspaceControllerResources } from "./useWorkspaceControllerResources";
import { useWorkspaceControllerRuntime } from "./useWorkspaceControllerRuntime";
import { useWorkspaceControllerSearch } from "./useWorkspaceControllerSearch";
import { useWorkspaceControllerServer } from "./useWorkspaceControllerServer";
import { useWorkspaceControllerSetup } from "./useWorkspaceControllerSetup";
import { useWorkspaceControllerSplit } from "./useWorkspaceControllerSplit";
import { useWorkspaceControllerStateBindings } from "./useWorkspaceControllerStateBindings";
import { useWorkspaceControllerTopicOperations } from "./useWorkspaceControllerTopicOperations";
export function useWorkspaceAppController() {
  const kafkaApi = window.kafkaApi;
  const controllerState = useWorkspaceControllerStateBindings();
  const {
    activeConsumeTaskKeys,
    activeDragPayload,
    activeWorkspacePane,
    brokersByServer,
    clearConsumeStateForPane,
    clearConsumeStatesForPane,
    clearMessageTarget,
    clearStoppedConsumer,
    closeServerContextMenu,
    closeTopicContextMenu,
    closeTopicCreateForm,
    connectedServerIds,
    consumeDefaultsByServer,
    consumeStatesByServer,
    draggingFavoriteTopic,
    draggingServerId,
    exportFormatTemplate,
    failedServerIds,
    favoriteDropTarget,
    favoriteTopicsByServer,
    fontFamily,
    fontSize,
    getDefaultConsumeState,
    getMessageTarget,
    getProduceDraft,
    getStopConsumerId,
    groupLagByServer,
    groupsByServer,
    isTopicSortMenuOpen,
    language,
    loading,
    manualAvroSchemasByServer,
    mergeConsumeState,
    messagePaneHeight,
    moveConsumeStateBetweenPanes,
    openClusterIds,
    openEditServerForm,
    openNewServerForm,
    openPreferences,
    openPreferencesSection,
    openTopicCreateForm,
    openedTopicTabsByServer,
    paneToast,
    pendingTopicAction,
    preferencesLoaded,
    resetProduceDrafts,
    resolvedLanguage,
    retargetLiveTopic,
    runPaneTask,
    runTask,
    runWorkspaceTask,
    selectedGroupByServer,
    selectedServerId,
    selectedTopicByServer,
    serverContextMenu,
    serverDropTarget,
    serverPanelHeight,
    servers,
    setServers,
    setActiveConsumeTaskKeys,
    setActiveDragPayload,
    setActiveWorkspacePane,
    setBrokersByServer,
    setConnectedServerIds,
    setConnectionError,
    setConsumeDefaultsByServer,
    setConsumeStates,
    setConsumeStatesByServer,
    setDraggingFavoriteTopic,
    setDraggingServerId,
    setExportFormatTemplate,
    setFailedServerIds,
    setFavoriteDropTarget,
    setFavoriteTopicsByServer,
    setFontFamily,
    setFontSize,
    setGroupLagByServer,
    setGroupsByServer,
    setHealthFailuresByServer,
    setIsTopicSortMenuOpen,
    setLanguage,
    setLoading,
    setManualAvroSchemasByServer,
    setMessagePaneHeight,
    setOpenClusterIds,
    setOpenedTopicTabsByServer,
    setPaneToast,
    setPendingTopicAction,
    setPreferencesLoaded,
    setSelectedGroupByServer,
    setSelectedServerId,
    setSelectedTopicByServer,
    setServerContextMenu,
    setServerDropTarget,
    setServerPanelHeight,
    setSidebarCollapsed,
    setSidebarWidth,
    setSplitConsumeStatesByServer,
    setSplitDropSide,
    splitPane,
    setSplitPane,
    setStartedConsumer,
    setStatus,
    setStreamingTopicsByServer,
    setToast,
    setTopicActionConfirmText,
    setTopicContextMenu,
    setTopicDetailByServer,
    setTopicDetailCacheByServer,
    setTopicGridSortingByServer,
    setTopicsByServer,
    setTopicViewByServer,
    setViewByServer,
    showPaneToast,
    sidebarCollapsed,
    sidebarWidth,
    splitConsumeStatesByServer,
    splitDropSide,
    splitPrimaryPercent,
    startServerPanelResize,
    startSidebarResize,
    startWorkspaceSplitResize,
    streamingTopicsByServer,
    toast,
    topicActionConfirmText,
    topicContextMenu,
    topicDetailByServer,
    topicDetailCacheByServer,
    topicGridSortingByServer,
    topicsByServer,
    topicViewByServer,
    updateConsumeStateFor,
    updateProduceDraftFor,
    viewByServer
  } = controllerState;
  const { manualAvroSchemaActions, settingsTransferActions } = useWorkspaceControllerSetup({
    menuDismissals: {
      serverContextMenuOpen: Boolean(serverContextMenu),
      topicContextMenuOpen: Boolean(topicContextMenu),
      topicSortMenuOpen: isTopicSortMenuOpen,
      closeServerContextMenu,
      closeTopicContextMenu,
      closeTopicSortMenu: () => setIsTopicSortMenuOpen(false)
    },
    settingsSchema: {
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
  const controllerSearch = useWorkspaceControllerSearch({
    appSearch: {
      servers,
      selectedServerId,
      contextServerId: serverContextMenu?.serverId,
      topicsByServer,
      openedTopicTabsByServer,
      manualAvroSchemasByServer,
      groupsByServer,
      connectedServerIds,
      favoriteTopicsByServer
    },
    favorites: {
      selectedServerId,
      setFavoriteTopicsByServer
    },
    rowSelection: {
      setToast
    },
    selectedTopicByServer,
    selectedServerId
  });
  const {
    serverQuery,
    setServerQuery,
    selectedServer,
    contextServer,
    filteredServers
  } = controllerSearch.serverSearch;
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
  } = controllerSearch.quickSearch;
  const {
    isSelectedServerConnected,
    topics,
    favoriteTopicNames
  } = controllerSearch;
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
    clearTopicQueryForServer,
    keepSelectedTopicRowsForServer,
    removeSelectedTopicRowsForServer
  } = controllerSearch.topicSearch;
  const { favoriteActions, rowSelectionActions } = controllerSearch;
  const { toggleFavoriteTopic, reorderFavoriteTopic } = favoriteActions;
  const { toggleTopicRow, toggleAllTopicRows, copySelectedTopicNames } = rowSelectionActions;
  const selectedTopic = controllerSearch.selectedTopic;
  const {
    getCachedTopicDetail,
    setTopicDetailForServer,
    selectedServerResourceSetters,
    brokerActions,
    topicActions
  } = useWorkspaceControllerResources({
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
    },
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
  const {
    setTopics,
    setSelectedTopic,
    setOpenedTopicTabs,
    setTopicDetail,
    setGroups
  } = selectedServerResourceSetters;
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
    setView,
    setTopicViewFor,
    getTopicViewFor,
    getTopicView,
    activateTopicView,
    activateSelectedTopicView,
    activateSplitSelectedTopicView,
    loadSplitTopicDetailSilent,
    activateSplitTopic,
    showServerViewInActivePane,
    selectPrimaryTopic,
    selectTopicInWorkspace,
    openTopicInWorkspace,
    openTopicTab
  } = useWorkspaceControllerNavigation({
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
  const {
    saveServer,
    deleteServer,
    connectServer,
    openCluster,
    ensureServerConnected,
    disconnectServer,
    closeClusterTab,
    handleServerDrop,
    handleServerDragEnd,
    handleFavoriteDrop,
    handleFavoriteDragEnd
  } = useWorkspaceControllerServer({
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
    showSplitView,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary,
    startTopicDrag,
    startSplitPaneDrag,
    clearDragPayload,
    handleWorkspaceDragOver,
    handleWorkspaceDrop
  } = useWorkspaceControllerSplit({
    split: {
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
    },
    dragPayloads: {
      setActiveDragPayload,
      setSplitDropSide
    },
    dragDrop: {
      activeDragPayload,
      setActiveDragPayload,
      setSplitDropSide
    }
  });
  const {
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction,
    submitTopicCreate
  } = useWorkspaceControllerTopicOperations({
    closeTopicCreateForm,
    topicOperations: {
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
    }
  });

  const selectedConsumeState = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;
  const {
    closeTopicTab,
    executeQuickSearch,
    manualAvroSchemaRows,
    manualAvroTopicNames,
    refreshActions,
    selectedConsumeActions
  } = useWorkspaceControllerInteractions({
    quickSearch: {
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
    },
    manualAvroSchemas: {
      manualAvroSchemasByServer,
      servers,
      selectedServerId
    },
    consumeRefresh: {
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
    },
    primaryTopicTab: {
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
    }
  });
  const { updateSelectedConsumeState, updateConsumeDefaults } = selectedConsumeActions;
  const { refreshCurrentView, refreshSplitPaneView, refreshActiveWorkspaceView } = refreshActions;

  useWorkspaceControllerRuntime({
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

  const activeWorkspaceView = getActiveWorkspaceView();
  const { sidebarProps, overlayProps } = useWorkspaceControllerChrome({
    state: controllerState,
    search: controllerSearch,
    manualAvroSchemaRows,
    manualAvroTopicNames,
    contextTopic,
    contextServer,
    sidebar: {
      onServerContextMenu: openServerContextMenu,
      openCluster,
      onServerDrop: handleServerDrop,
      onServerDragEnd: handleServerDragEnd,
      refreshTopics,
      onCommitTopicSearch: commitTopicSearch,
      onRemoveTopicSearchHistory: removeTopicSearchHistory,
      selectTopicInWorkspace,
      openTopicTab,
      onTopicFavorite: toggleFavoriteTopic,
      onTopicContextMenu: openTopicContextMenu,
      getWorkspaceTargetForTopic: getWorkspaceTargetForServer,
      onFavoriteDrop: handleFavoriteDrop,
      onFavoriteDragEnd: handleFavoriteDragEnd
    },
    overlay: {
      onSaveServer: saveServer,
      onExecuteQuickSearch: (result) => void executeQuickSearch(result),
      onOpenManualAvroSchema: openManualAvroSchema,
      onDeleteManualAvroSchemaFor: deleteManualAvroSchemaFor,
      onReadSchemaFile: readSchemaFile,
      onDeleteManualAvroSchema: deleteManualAvroSchema,
      onSaveManualAvroSchema: saveManualAvroSchema,
      onCreateTopic: submitTopicCreate,
      confirmTopicAction,
      openTopicTab,
      copySelectedTopicNames,
      onRegisterAvroSchema: openManualAvroSchema,
      onTopicAction: requestTopicAction,
      connectServer,
      disconnectServer,
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
  const workspaceLayoutProps = useWorkspaceControllerLayout({
    state: controllerState,
    visibleSplitPane,
    onWorkspaceDragOver: handleWorkspaceDragOver,
    onWorkspaceDrop: (event) => void handleWorkspaceDrop(event),
    sidebarProps,
    primaryPaneProps,
    splitPaneProps,
    overlayProps
  });

  return workspaceLayoutProps;
}
