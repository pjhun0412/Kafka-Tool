import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerServerParams } from "../useWorkspaceControllerServer";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type ServerResourceSetters = WorkspaceControllerServerParams["resourceSetters"];
type ServerRefreshActions = WorkspaceControllerServerParams["refreshActions"];
type ServerActions = Pick<WorkspaceControllerServerParams, "reorderFavoriteTopic" | "runTask" | "stopConsume">;

export function createWorkspaceServerParams({
  state,
  resourceSetters,
  refreshActions,
  actions
}: {
  state: ControllerState;
  resourceSetters: ServerResourceSetters;
  refreshActions: ServerRefreshActions;
  actions: ServerActions;
}): WorkspaceControllerServerParams {
  return {
    state,
    resourceSetters,
    refreshActions,
    reorderFavoriteTopic: actions.reorderFavoriteTopic,
    runTask: actions.runTask,
    stopConsume: actions.stopConsume
  };
}
