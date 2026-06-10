import {
  usePrimaryTopicNavigationActions,
  useServerViewNavigation,
  useSplitTopicActivation,
  useSplitTopicDetailActions,
  useTopicViewActions
} from "../workspace";

type WorkspaceNavigationCompositionParams = {
  splitTopicDetail: Parameters<typeof useSplitTopicDetailActions>[0];
  topicView: Omit<Parameters<typeof useTopicViewActions>[0], "loadSplitTopicDetailSilent">;
  splitTopicActivation: Omit<
    Parameters<typeof useSplitTopicActivation>[0],
    "getTopicViewFor" | "loadSplitTopicDetail"
  >;
  serverView: Omit<
    Parameters<typeof useServerViewNavigation>[0],
    "activateSelectedTopicView" | "activateSplitSelectedTopicView" | "setView"
  >;
  primaryTopicNavigation: Omit<
    Parameters<typeof usePrimaryTopicNavigationActions>[0],
    "getTopicViewFor" | "activateSplitTopic"
  >;
};

export function useWorkspaceNavigationComposition(params: WorkspaceNavigationCompositionParams) {
  const splitTopicDetailActions = useSplitTopicDetailActions(params.splitTopicDetail);
  const topicViewActions = useTopicViewActions({
    ...params.topicView,
    loadSplitTopicDetailSilent: splitTopicDetailActions.loadSplitTopicDetailSilent
  });
  const splitTopicActivationActions = useSplitTopicActivation({
    ...params.splitTopicActivation,
    getTopicViewFor: topicViewActions.getTopicViewFor,
    loadSplitTopicDetail: splitTopicDetailActions.loadSplitTopicDetail
  });
  const serverViewActions = useServerViewNavigation({
    ...params.serverView,
    activateSelectedTopicView: topicViewActions.activateSelectedTopicView,
    activateSplitSelectedTopicView: topicViewActions.activateSplitSelectedTopicView,
    setView: topicViewActions.setView
  });
  const primaryTopicNavigationActions = usePrimaryTopicNavigationActions({
    ...params.primaryTopicNavigation,
    getTopicViewFor: topicViewActions.getTopicViewFor,
    activateSplitTopic: splitTopicActivationActions.activateSplitTopic
  });

  return {
    splitTopicDetailActions,
    topicViewActions,
    splitTopicActivationActions,
    serverViewActions,
    primaryTopicNavigationActions
  };
}
