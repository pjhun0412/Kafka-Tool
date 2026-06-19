import { useConsumerGroupAppActions } from "../actions/useConsumerGroupAppActions";
import { useWorkspaceContextMenuActions } from "../actions/useWorkspaceContextMenuActions";
import { useWorkspaceDerivedState } from "../state/useWorkspaceDerivedState";
import { useWorkspaceControllerMessageFlow } from "./useWorkspaceControllerMessageFlow";
import { useWorkspaceControllerModels } from "./useWorkspaceControllerModels";
import { useWorkspaceControllerNavigation } from "./useWorkspaceControllerNavigation";
import { useWorkspaceControllerInteractions } from "./useWorkspaceControllerInteractions";
import { useWorkspaceControllerResources } from "./useWorkspaceControllerResources";
import { useWorkspaceControllerSearch } from "./useWorkspaceControllerSearch";
import { useWorkspaceControllerServer } from "./useWorkspaceControllerServer";
import { useWorkspaceControllerSetup } from "./useWorkspaceControllerSetup";
import { useWorkspaceControllerSplit } from "./useWorkspaceControllerSplit";
import { useWorkspaceControllerStateBindings } from "./useWorkspaceControllerStateBindings";
import { useWorkspaceControllerTopicOperations } from "./useWorkspaceControllerTopicOperations";
import { createWorkspaceConsumerGroupParams } from "./consumerGroups/workspaceConsumerGroupParams";
import { createWorkspaceContextMenuParams } from "./contextMenus/workspaceContextMenuParams";
import { createWorkspaceDerivedStateParams } from "./derived/workspaceDerivedStateParams";
import { createWorkspaceInteractionParams } from "./interactions/workspaceInteractionParams";
import { createWorkspaceMessageFlowParams } from "./messageFlow/workspaceMessageFlowParams";
import { createWorkspaceModelParams } from "./models/workspaceModelParams";
import { createWorkspaceNavigationParams } from "./navigation/workspaceNavigationParams";
import { createWorkspaceResourceParams } from "./resources/workspaceResourceParams";
import { createWorkspaceSearchParams } from "./search/workspaceSearchParams";
import { createWorkspaceServerParams } from "./server/workspaceServerParams";
import { createWorkspaceSetupParams } from "./setup/workspaceSetupParams";
import { createWorkspaceSplitParams } from "./split/workspaceSplitParams";
import { createWorkspaceTopicOperationParams } from "./topics/workspaceTopicOperationParams";
import { useWorkspaceControllerViewComposition } from "./view/workspaceViewComposition";
export function useWorkspaceAppController() {
  const controllerState = useWorkspaceControllerStateBindings();
  const {
    closeTopicCreateForm,
    resolvedLanguage,
    runPaneTask,
    runTask,
    runWorkspaceTask,
    showPaneToast,
  } = controllerState;
  const controllerSetup = useWorkspaceControllerSetup(
    createWorkspaceSetupParams(controllerState)
  );
  const { manualAvroSchemaActions } = controllerSetup;
  const { openManualAvroSchema } = manualAvroSchemaActions;
  const controllerSearch = useWorkspaceControllerSearch(createWorkspaceSearchParams(controllerState));
  const {
    isQuickSearchOpen,
    quickSearchIndex,
    setQuickSearchIndex,
    quickSearchResults,
    openQuickSearch,
    closeQuickSearch,
    rememberQuickSearch
  } = controllerSearch.quickSearch;
  const {
    selectedTopicRows,
    clearTopicQueryForServer,
    keepSelectedTopicRowsForServer,
    removeSelectedTopicRowsForServer
  } = controllerSearch.topicSearch;
  const { favoriteActions } = controllerSearch;
  const { reorderFavoriteTopic } = favoriteActions;
  const selectedTopic = controllerSearch.selectedTopic;
  const controllerResources = useWorkspaceControllerResources(createWorkspaceResourceParams({
    state: controllerState,
    actions: {
      clearTopicQueryForServer,
      keepSelectedTopicRowsForServer,
      runTask,
      runWorkspaceTask
    }
  }));
  const {
    getCachedTopicDetail,
    setTopicDetailForServer,
    setTopics,
    setSelectedTopic,
    setOpenedTopicTabs,
    setTopicDetail,
    setGroups,
    refreshBrokers,
    refreshBrokersForServer,
    refreshTopicsForServer,
    refreshTopics,
    loadTopicDetail,
    loadTopicDetailSilent
  } = controllerResources;
  const derivedState = useWorkspaceDerivedState(createWorkspaceDerivedStateParams(controllerState));
  const {
    view,
    openedTopicTabs,
    previewTopic,
    topicDetail,
    consumeStates,
    selectedDefaultConsumeState,
    visibleSplitPane
  } = derivedState;
  const controllerModels = useWorkspaceControllerModels(createWorkspaceModelParams({
    state: controllerState,
    derived: {
      view,
      openedTopicTabs,
      topicDetail,
      visibleSplitPane,
      selectedTopic
    }
  }));
  const {
    splitConsumeState,
    getWorkspaceTargetForServer,
    isTopicStreaming,
  } = controllerModels;
  const contextMenuActions = useWorkspaceContextMenuActions(createWorkspaceContextMenuParams(controllerState));
  const consumerGroupActions = useConsumerGroupAppActions(createWorkspaceConsumerGroupParams({
    state: controllerState,
    derived: {
      selectedTopic,
      visibleSplitPane
    }
  }));
  const {
    refreshGroups,
    refreshGroupsForServer,
    loadConsumerGroupLagFor
  } = consumerGroupActions;
  const navigationActions = useWorkspaceControllerNavigation(createWorkspaceNavigationParams({
    state: controllerState,
    derived: {
      selectedTopic,
      view,
      visibleSplitPane
    },
    actions: {
      getCachedTopicDetail,
      getWorkspaceTargetForServer,
      loadTopicDetailSilent,
      refreshBrokers,
      refreshBrokersForServer,
      refreshGroups,
      refreshGroupsForServer,
      refreshTopics,
      refreshTopicsForServer,
      setSelectedTopic,
      setTopicDetailForServer
    }
  }));
  const {
    setView,
    setTopicViewFor,
    getTopicViewFor,
    loadSplitTopicDetailSilent,
    selectPrimaryTopic,
    openTopicInWorkspace,
  } = navigationActions;
  const messageFlowActions = useWorkspaceControllerMessageFlow(createWorkspaceMessageFlowParams({
    state: controllerState,
    derived: {
      consumeStates,
      selectedDefaultConsumeState,
      selectedTopic
    },
    actions: {
      setView
    }
  }));
  const { stopConsume } = messageFlowActions;
  const serverActions = useWorkspaceControllerServer(createWorkspaceServerParams({
    state: controllerState,
    resourceSetters: {
      setOpenedTopicTabs,
      setSelectedTopic,
      setTopicDetail,
      setTopics,
      setGroups
    },
    refreshActions: {
      refreshTopicsForServer,
      refreshBrokersForServer,
      refreshGroupsForServer
    },
    actions: {
      reorderFavoriteTopic,
      runTask,
      stopConsume
    }
  }));
  const { ensureServerConnected } = serverActions;
  const splitActions = useWorkspaceControllerSplit(createWorkspaceSplitParams({
    state: controllerState,
    derived: {
      openedTopicTabs,
      previewTopic,
      selectedTopic,
      getTopicViewFor,
      getCachedTopicDetail,
      setTopicDetailForServer,
      isTopicStreaming,
      setOpenedTopicTabs,
      setSelectedTopic,
      setTopicDetail
    },
    navigation: {
      setTopicViewFor,
      loadSplitTopicDetailSilent,
      selectPrimaryTopic
    },
    refreshActions: {
      refreshBrokersForServer,
      refreshTopicsForServer,
      refreshGroupsForServer
    },
    stopConsume
  }));
  const { closeSplitPane, moveSplitTopicToPrimary, openSplitForTopic, promoteSplitPaneToPrimary } = splitActions;
  const topicOperationActions = useWorkspaceControllerTopicOperations(createWorkspaceTopicOperationParams({
    state: controllerState,
    derived: {
      selectedTopic,
      selectedTopicRows
    },
    actions: {
      runTask,
      stopConsume,
      refreshTopicsForServer,
      loadTopicDetail,
      selectPrimaryTopic,
      removeSelectedTopicRowsForServer
    },
    closeTopicCreateForm: controllerState.closeTopicCreateForm
  }));
  const { requestTopicAction, requestTopicActionFor } = topicOperationActions;

  const selectedConsumeState = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;
  const interactionActions = useWorkspaceControllerInteractions(createWorkspaceInteractionParams({
    state: controllerState,
    derived: {
      isQuickSearchOpen,
      openedTopicTabs,
      previewTopic,
      quickSearchIndex,
      quickSearchResults,
      selectedConsumeState,
      selectedDefaultConsumeState,
      selectedTopic,
      splitConsumeState,
      view,
      visibleSplitPane
    },
    actions: {
      closeQuickSearch,
      closeSplitPane,
      ensureServerConnected,
      getWorkspaceTargetForServer,
      isTopicStreaming,
      loadConsumerGroupLagFor,
      loadSplitTopicDetailSilent,
      loadTopicDetail,
      loadTopicDetailSilent,
      openManualAvroSchema,
      openQuickSearch,
      moveSplitTopicToPrimary,
      openSplitForTopic,
      openTopicInWorkspace,
      promoteSplitPaneToPrimary,
      refreshBrokers,
      refreshBrokersForServer,
      refreshGroups,
      refreshGroupsForServer,
      refreshTopics,
      refreshTopicsForServer,
      rememberQuickSearch,
      requestTopicAction,
      requestTopicActionFor,
      runPaneTask,
      selectPrimaryTopic,
      setGroups,
      setOpenedTopicTabs,
      setQuickSearchIndex,
      setSelectedTopic,
      setTopicDetail,
      setView,
      showPaneToast,
      stopConsume
    }
  }));

  return useWorkspaceControllerViewComposition({
    state: controllerState,
    language: resolvedLanguage,
    setup: controllerSetup,
    search: controllerSearch,
    resources: controllerResources,
    derivedState,
    models: controllerModels,
    contextMenus: contextMenuActions,
    consumerGroups: consumerGroupActions,
    navigation: navigationActions,
    messageFlow: messageFlowActions,
    server: serverActions,
    split: splitActions,
    topicOperations: topicOperationActions,
    interactions: interactionActions
  });
}
