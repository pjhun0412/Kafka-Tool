import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerTopicOperationsParams } from "../useWorkspaceControllerTopicOperations";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type TopicOperationDerived = Pick<
  WorkspaceControllerTopicOperationsParams["state"],
  "selectedTopic" | "selectedTopicRows"
>;

export function createWorkspaceTopicOperationParams({
  state,
  derived,
  actions,
  closeTopicCreateForm
}: {
  state: ControllerState;
  derived: TopicOperationDerived;
  actions: WorkspaceControllerTopicOperationsParams["actions"];
  closeTopicCreateForm: WorkspaceControllerTopicOperationsParams["closeTopicCreateForm"];
}): WorkspaceControllerTopicOperationsParams {
  return {
    state: {
      ...state,
      ...derived
    },
    actions,
    closeTopicCreateForm
  };
}
