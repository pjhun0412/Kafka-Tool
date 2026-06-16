import type { useConsumerGroupAppActions } from "../../actions/useConsumerGroupAppActions";
import type { useWorkspaceContextMenuActions } from "../../actions/useWorkspaceContextMenuActions";
import type { useWorkspaceDerivedState } from "../../state/useWorkspaceDerivedState";
import { createWorkspaceChromeParams } from "../chrome/workspaceChromeParams";
import { createWorkspaceLayoutParams } from "../layout/workspaceLayoutParams";
import { createWorkspacePaneParams } from "../panes/workspacePaneParams";
import { createWorkspaceRuntimeParams } from "../runtime/workspaceRuntimeParams";
import type { useWorkspaceControllerInteractions } from "../useWorkspaceControllerInteractions";
import { useWorkspaceControllerChrome } from "../useWorkspaceControllerChrome";
import { useWorkspaceControllerLayout } from "../useWorkspaceControllerLayout";
import type { useWorkspaceControllerMessageFlow } from "../useWorkspaceControllerMessageFlow";
import type { useWorkspaceControllerModels } from "../useWorkspaceControllerModels";
import type { useWorkspaceControllerNavigation } from "../useWorkspaceControllerNavigation";
import { useWorkspaceControllerPanes } from "../useWorkspaceControllerPanes";
import type { useWorkspaceControllerResources } from "../useWorkspaceControllerResources";
import { useWorkspaceControllerRuntime } from "../useWorkspaceControllerRuntime";
import type { useWorkspaceControllerSearch } from "../useWorkspaceControllerSearch";
import type { useWorkspaceControllerServer } from "../useWorkspaceControllerServer";
import type { useWorkspaceControllerSetup } from "../useWorkspaceControllerSetup";
import type { useWorkspaceControllerSplit } from "../useWorkspaceControllerSplit";
import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { useWorkspaceControllerTopicOperations } from "../useWorkspaceControllerTopicOperations";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;
type ControllerSetup = ReturnType<typeof useWorkspaceControllerSetup>;
type ControllerSearch = ReturnType<typeof useWorkspaceControllerSearch>;
type ControllerResources = ReturnType<typeof useWorkspaceControllerResources>;
type ControllerDerivedState = ReturnType<typeof useWorkspaceDerivedState>;
type ControllerModels = ReturnType<typeof useWorkspaceControllerModels>;
type ControllerContextMenus = ReturnType<typeof useWorkspaceContextMenuActions>;
type ControllerConsumerGroups = ReturnType<typeof useConsumerGroupAppActions>;
type ControllerNavigation = ReturnType<typeof useWorkspaceControllerNavigation>;
type ControllerMessageFlow = ReturnType<typeof useWorkspaceControllerMessageFlow>;
type ControllerServer = ReturnType<typeof useWorkspaceControllerServer>;
type ControllerSplit = ReturnType<typeof useWorkspaceControllerSplit>;
type ControllerTopicOperations = ReturnType<typeof useWorkspaceControllerTopicOperations>;
type ControllerInteractions = ReturnType<typeof useWorkspaceControllerInteractions>;

export function useWorkspaceControllerViewComposition(params: {
  state: ControllerState;
  language: ControllerState["resolvedLanguage"];
  setup: ControllerSetup;
  search: ControllerSearch;
  resources: ControllerResources;
  derivedState: ControllerDerivedState;
  models: ControllerModels;
  contextMenus: ControllerContextMenus;
  consumerGroups: ControllerConsumerGroups;
  navigation: ControllerNavigation;
  messageFlow: ControllerMessageFlow;
  server: ControllerServer;
  split: ControllerSplit;
  topicOperations: ControllerTopicOperations;
  interactions: ControllerInteractions;
}) {
  const {
    state,
    language,
    setup,
    search,
    resources,
    derivedState,
    models,
    contextMenus,
    consumerGroups,
    navigation,
    messageFlow,
    server,
    split,
    topicOperations,
    interactions
  } = params;
  const selectedTopic = search.selectedTopic;
  const selectedConsumeState = derivedState.consumeStates[selectedTopic] ?? derivedState.selectedDefaultConsumeState;
  const contextTopic = state.topicContextMenu?.topic ?? "";
  const activeWorkspaceView = models.getActiveWorkspaceView();
  const { refreshActions, selectedConsumeActions } = interactions;

  useWorkspaceControllerRuntime(createWorkspaceRuntimeParams({
    state,
    language,
    applyImportedSettings: setup.settingsTransferActions.applyImportedSettings,
    importSettings: setup.settingsTransferActions.importSettings,
    exportSettings: setup.settingsTransferActions.exportSettings,
    selectedServerResources: {
      refreshTopics: resources.refreshTopics,
      refreshBrokers: resources.refreshBrokers,
      refreshGroups: consumerGroups.refreshGroups,
      setTopics: resources.setTopics,
      setGroups: resources.setGroups,
      setSelectedTopic: resources.setSelectedTopic,
      setTopicDetail: resources.setTopicDetail,
      setBrokersByServer: state.setBrokersByServer
    }
  }));

  const { sidebarProps, overlayProps } = useWorkspaceControllerChrome(createWorkspaceChromeParams({
    state,
    derived: {
      search,
      manualAvroSchemaRows: interactions.manualAvroSchemaRows,
      manualAvroTopicNames: interactions.manualAvroTopicNames,
      contextTopic,
      contextServer: search.serverSearch.contextServer
    },
    sidebar: {
      onServerContextMenu: contextMenus.openServerContextMenu,
      openCluster: server.openCluster,
      onServerDrop: server.handleServerDrop,
      onServerDragEnd: server.handleServerDragEnd,
      refreshTopics: resources.refreshTopics,
      onCommitTopicSearch: search.topicSearch.commitTopicSearch,
      onRemoveTopicSearchHistory: search.topicSearch.removeTopicSearchHistory,
      selectTopicInWorkspace: navigation.selectTopicInWorkspace,
      openTopicTab: navigation.openTopicTab,
      onTopicFavorite: search.favoriteActions.toggleFavoriteTopic,
      onTopicContextMenu: contextMenus.openTopicContextMenu,
      getWorkspaceTargetForTopic: models.getWorkspaceTargetForServer,
      onFavoriteDrop: server.handleFavoriteDrop,
      onFavoriteDragEnd: server.handleFavoriteDragEnd
    },
    overlay: {
      onSaveServer: server.saveServer,
      executeQuickSearch: interactions.executeQuickSearch,
      onOpenManualAvroSchema: setup.manualAvroSchemaActions.openManualAvroSchema,
      onDeleteManualAvroSchemaFor: setup.manualAvroSchemaActions.deleteManualAvroSchemaFor,
      onReadSchemaFile: setup.manualAvroSchemaActions.readSchemaFile,
      onDeleteManualAvroSchema: setup.manualAvroSchemaActions.deleteManualAvroSchema,
      onSaveManualAvroSchema: setup.manualAvroSchemaActions.saveManualAvroSchema,
      onCreateTopic: topicOperations.submitTopicCreate,
      confirmTopicAction: topicOperations.confirmTopicAction,
      openTopicTab: navigation.openTopicTab,
      copySelectedTopicNames: search.rowSelectionActions.copySelectedTopicNames,
      onRegisterAvroSchema: setup.manualAvroSchemaActions.openManualAvroSchema,
      onTopicAction: topicOperations.requestTopicAction,
      connectServer: server.connectServer,
      disconnectServer: server.disconnectServer,
      deleteServer: server.deleteServer
    }
  }));

  const { primaryPaneProps, splitPaneProps } = useWorkspaceControllerPanes(createWorkspacePaneParams({
    state,
    language,
    derived: {
      activeWorkspaceView,
      isSelectedServerConnected: search.isSelectedServerConnected,
      manualAvroTopicNames: interactions.manualAvroTopicNames,
      openedTopicTabs: derivedState.openedTopicTabs,
      previewTopic: derivedState.previewTopic,
      primaryModel: models.primaryModel,
      primaryPaneToast: models.primaryPaneToast,
      selectedServer: search.serverSearch.selectedServer,
      selectedTopic,
      selectedTopicRows: search.topicSearch.selectedTopicRows,
      selectedConsumeState,
      selectedProduceDraft: derivedState.selectedProduceDraft,
      sortedTopics: search.topicSearch.sortedTopics,
      splitConsumeState: models.splitConsumeState,
      splitModel: models.splitModel,
      splitPaneToast: models.splitPaneToast,
      splitProduceDraft: derivedState.splitProduceDraft,
      splitServer: models.splitServer,
      topicDetail: derivedState.topicDetail,
      updateTopicGridSortingForServer: models.updateTopicGridSortingForServer,
      view: derivedState.view,
      visibleSplitPane: derivedState.visibleSplitPane
    },
    actions: {
      activateSplitTopic: navigation.activateSplitTopic,
      clearDragPayload: split.clearDragPayload,
      closeClusterTab: server.closeClusterTab,
      closeSplitPane: split.closeSplitPane,
      closeSplitTopicTab: split.closeSplitTopicTab,
      closeTopicTab: interactions.closeTopicTab,
      copySelectedTopicNames: search.rowSelectionActions.copySelectedTopicNames,
      deleteConsumerGroupsFor: consumerGroups.deleteConsumerGroupsFor,
      exportConsumedMessages: messageFlow.exportConsumedMessages,
      exportOffsetConditionMessages: messageFlow.exportOffsetConditionMessages,
      isConsumeTaskActive: models.isConsumeTaskActive,
      isTopicStreaming: models.isTopicStreaming,
      loadConsumerGroupLag: consumerGroups.loadConsumerGroupLag,
      loadConsumerGroupLagFor: consumerGroups.loadConsumerGroupLagFor,
      moveOffsetPageFor: messageFlow.moveOffsetPageFor,
      openManualAvroSchema: setup.manualAvroSchemaActions.openManualAvroSchema,
      openTopicCreateForm: state.openTopicCreateForm,
      openTopicTab: navigation.openTopicTab,
      produce: messageFlow.produce,
      produceFor: messageFlow.produceFor,
      refreshActiveWorkspaceView: refreshActions.refreshActiveWorkspaceView,
      refreshCurrentView: refreshActions.refreshCurrentView,
      refreshGroupsForServer: consumerGroups.refreshGroupsForServer,
      refreshSplitPaneView: refreshActions.refreshSplitPaneView,
      requestTopicAction: topicOperations.requestTopicAction,
      selectTopicInWorkspace: navigation.selectTopicInWorkspace,
      sendMessageToProduce: messageFlow.sendMessageToProduce,
      setView: navigation.setView,
      showServerViewInActivePane: navigation.showServerViewInActivePane,
      showSplitView: split.showSplitView,
      startConsume: messageFlow.startConsume,
      startConsumeFor: messageFlow.startConsumeFor,
      startSplitPaneDrag: split.startSplitPaneDrag,
      startTopicDrag: split.startTopicDrag,
      stopConsume: messageFlow.stopConsume,
      toggleAllTopicRows: search.rowSelectionActions.toggleAllTopicRows,
      toggleFavoriteTopic: search.favoriteActions.toggleFavoriteTopic,
      toggleTopicRow: search.rowSelectionActions.toggleTopicRow,
      updateConsumeDefaults: selectedConsumeActions.updateConsumeDefaults,
      updateConsumeStateFor: state.updateConsumeStateFor,
      updateProduceDraftFor: state.updateProduceDraftFor,
      updateSelectedConsumeState: selectedConsumeActions.updateSelectedConsumeState
    }
  }));

  return useWorkspaceControllerLayout(createWorkspaceLayoutParams({
    state,
    visibleSplitPane: derivedState.visibleSplitPane,
    onWorkspaceDragOver: split.handleWorkspaceDragOver,
    onWorkspaceDrop: (event) => void split.handleWorkspaceDrop(event),
    sidebarProps,
    primaryPaneProps,
    splitPaneProps,
    overlayProps
  }));
}
