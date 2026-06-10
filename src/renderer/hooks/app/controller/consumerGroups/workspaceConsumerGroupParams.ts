import type { ConsumerGroupAppActionsParams } from "../../actions/useConsumerGroupAppActions";
import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type ConsumerGroupDerived = Pick<
  ConsumerGroupAppActionsParams,
  "selectedTopic" | "visibleSplitPane"
>;

export function createWorkspaceConsumerGroupParams({
  state,
  derived
}: {
  state: ControllerState;
  derived: ConsumerGroupDerived;
}): ConsumerGroupAppActionsParams {
  return {
    kafkaApi: window.kafkaApi,
    selectedServerId: state.selectedServerId,
    selectedTopic: derived.selectedTopic,
    visibleSplitPane: derived.visibleSplitPane,
    runTask: state.runTask,
    runWorkspaceTask: state.runWorkspaceTask,
    setGroupsByServer: state.setGroupsByServer,
    setSelectedGroupByServer: state.setSelectedGroupByServer,
    setGroupLagByServer: state.setGroupLagByServer
  };
}
