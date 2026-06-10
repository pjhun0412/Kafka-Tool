import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerSplitParams } from "../useWorkspaceControllerSplit";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type SplitDerived = Pick<
  WorkspaceControllerSplitParams["state"],
  | "getCachedTopicDetail"
  | "getTopicViewFor"
  | "isTopicStreaming"
  | "openedTopicTabs"
  | "selectedTopic"
  | "setOpenedTopicTabs"
  | "setSelectedTopic"
  | "setTopicDetail"
  | "setTopicDetailForServer"
>;

export function createWorkspaceSplitParams({
  state,
  derived,
  navigation,
  refreshActions,
  stopConsume
}: {
  state: ControllerState;
  derived: SplitDerived;
  navigation: WorkspaceControllerSplitParams["navigation"];
  refreshActions: WorkspaceControllerSplitParams["refreshActions"];
  stopConsume: WorkspaceControllerSplitParams["stopConsume"];
}): WorkspaceControllerSplitParams {
  return {
    state: {
      ...state,
      ...derived
    },
    navigation,
    refreshActions,
    stopConsume
  };
}
