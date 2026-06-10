import { useWorkspaceNavigationComposition } from "../workspace/useWorkspaceNavigationComposition";

export type WorkspaceControllerNavigationParams = Parameters<typeof useWorkspaceNavigationComposition>[0];

export function useWorkspaceControllerNavigation(params: WorkspaceControllerNavigationParams) {
  const {
    splitTopicDetailActions,
    topicViewActions,
    splitTopicActivationActions,
    serverViewActions,
    primaryTopicNavigationActions
  } = useWorkspaceNavigationComposition(params);

  return {
    setView: topicViewActions.setView,
    setTopicViewFor: topicViewActions.setTopicViewFor,
    getTopicViewFor: topicViewActions.getTopicViewFor,
    getTopicView: topicViewActions.getTopicView,
    activateTopicView: topicViewActions.activateTopicView,
    activateSelectedTopicView: topicViewActions.activateSelectedTopicView,
    activateSplitSelectedTopicView: topicViewActions.activateSplitSelectedTopicView,
    loadSplitTopicDetailSilent: splitTopicDetailActions.loadSplitTopicDetailSilent,
    activateSplitTopic: splitTopicActivationActions.activateSplitTopic,
    showServerViewInActivePane: serverViewActions.showServerViewInActivePane,
    selectPrimaryTopic: primaryTopicNavigationActions.selectPrimaryTopic,
    selectTopicInWorkspace: primaryTopicNavigationActions.selectTopicInWorkspace,
    openTopicInWorkspace: primaryTopicNavigationActions.openTopicInWorkspace,
    openTopicTab: primaryTopicNavigationActions.openTopicTab
  };
}
