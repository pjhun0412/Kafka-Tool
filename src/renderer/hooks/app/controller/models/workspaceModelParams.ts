import type { WorkspaceControllerModelsParams } from "../useWorkspaceControllerModels";
import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type ModelDerived = WorkspaceControllerModelsParams["derived"] & Pick<WorkspaceControllerModelsParams, "selectedTopic">;

export function createWorkspaceModelParams({
  state,
  derived
}: {
  state: ControllerState;
  derived: ModelDerived;
}): WorkspaceControllerModelsParams {
  return {
    state,
    derived: {
      view: derived.view,
      openedTopicTabs: derived.openedTopicTabs,
      topicDetail: derived.topicDetail,
      visibleSplitPane: derived.visibleSplitPane
    },
    selectedTopic: derived.selectedTopic
  };
}
