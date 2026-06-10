import type { WorkspaceControllerRuntimeParams } from "../useWorkspaceControllerRuntime";
import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type RuntimeResourceActions = WorkspaceControllerRuntimeParams["selectedServerResources"];

export function createWorkspaceRuntimeParams(params: {
  state: ControllerState;
  language: WorkspaceControllerRuntimeParams["language"];
  applyImportedSettings: WorkspaceControllerRuntimeParams["applyImportedSettings"];
  selectedServerResources: RuntimeResourceActions;
}): WorkspaceControllerRuntimeParams {
  return {
    kafkaApi: window.kafkaApi,
    state: params.state,
    language: params.language,
    applyImportedSettings: params.applyImportedSettings,
    selectedServerResources: params.selectedServerResources
  };
}
