import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerNavigationParams } from "../useWorkspaceControllerNavigation";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type NavigationDerived = Pick<
  WorkspaceControllerNavigationParams["topicView"],
  "selectedTopic" | "visibleSplitPane"
> &
  Pick<WorkspaceControllerNavigationParams["serverView"], "view">;

type NavigationActions = Pick<
  WorkspaceControllerNavigationParams["splitTopicDetail"],
  "getCachedTopicDetail"
> &
  Pick<
    WorkspaceControllerNavigationParams["serverView"],
    | "refreshBrokers"
    | "refreshBrokersForServer"
    | "refreshGroups"
    | "refreshGroupsForServer"
    | "refreshTopics"
    | "refreshTopicsForServer"
  > &
  Pick<
    WorkspaceControllerNavigationParams["primaryTopicNavigation"],
    "getWorkspaceTargetForServer" | "loadTopicDetailSilent" | "setSelectedTopic" | "setTopicDetailForServer"
  >;

export function createWorkspaceNavigationParams({
  state,
  derived,
  actions
}: {
  state: ControllerState;
  derived: NavigationDerived;
  actions: NavigationActions;
}): WorkspaceControllerNavigationParams {
  return {
    splitTopicDetail: {
      kafkaApi: window.kafkaApi,
      getCachedTopicDetail: actions.getCachedTopicDetail,
      runPaneTask: state.runPaneTask,
      setSplitPane: state.setSplitPane,
      setTopicDetailCacheByServer: state.setTopicDetailCacheByServer
    },
    topicView: {
      selectedServerId: state.selectedServerId,
      selectedTopic: derived.selectedTopic,
      visibleSplitPane: derived.visibleSplitPane,
      topicViewByServer: state.topicViewByServer,
      setViewByServer: state.setViewByServer,
      setTopicViewByServer: state.setTopicViewByServer,
      setSplitPane: state.setSplitPane
    },
    splitTopicActivation: {
      splitPane: state.splitPane,
      setSplitPane: state.setSplitPane,
      setActiveWorkspacePane: state.setActiveWorkspacePane
    },
    serverView: {
      activeWorkspacePane: state.activeWorkspacePane,
      selectedServerId: state.selectedServerId,
      view: derived.view,
      visibleSplitPane: derived.visibleSplitPane,
      brokersByServer: state.brokersByServer,
      topicsByServer: state.topicsByServer,
      groupsByServer: state.groupsByServer,
      refreshBrokers: actions.refreshBrokers,
      refreshTopics: actions.refreshTopics,
      refreshGroups: actions.refreshGroups,
      refreshBrokersForServer: actions.refreshBrokersForServer,
      refreshTopicsForServer: actions.refreshTopicsForServer,
      refreshGroupsForServer: actions.refreshGroupsForServer,
      setSplitPane: state.setSplitPane
    },
    primaryTopicNavigation: {
      kafkaApi: window.kafkaApi,
      selectedServerId: state.selectedServerId,
      getWorkspaceTargetForServer: actions.getWorkspaceTargetForServer,
      getCachedTopicDetail: actions.getCachedTopicDetail,
      setTopicDetailForServer: actions.setTopicDetailForServer,
      loadTopicDetailSilent: actions.loadTopicDetailSilent,
      runWorkspaceTask: state.runWorkspaceTask,
      setActiveWorkspacePane: state.setActiveWorkspacePane,
      setSelectedServerId: state.setSelectedServerId,
      setOpenClusterIds: state.setOpenClusterIds,
      setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
      setSelectedTopicByServer: state.setSelectedTopicByServer,
      setSelectedTopic: actions.setSelectedTopic,
      setViewByServer: state.setViewByServer,
      setTopicViewByServer: state.setTopicViewByServer
    }
  };
}
