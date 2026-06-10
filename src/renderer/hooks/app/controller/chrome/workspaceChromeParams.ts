import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerChromeParams } from "../workspaceControllerChromeTypes";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type ChromeDerived = Pick<
  WorkspaceControllerChromeParams,
  "contextServer" | "contextTopic" | "manualAvroSchemaRows" | "manualAvroTopicNames" | "search"
>;

type ChromeSidebarActions = WorkspaceControllerChromeParams["sidebar"];
type ChromeOverlayActions = Omit<WorkspaceControllerChromeParams["overlay"], "onExecuteQuickSearch"> & {
  executeQuickSearch: Parameters<WorkspaceControllerChromeParams["overlay"]["onExecuteQuickSearch"]>[0] extends infer Result
    ? (result: Result) => void | Promise<void>
    : never;
};

export function createWorkspaceChromeParams({
  state,
  derived,
  sidebar,
  overlay
}: {
  state: ControllerState;
  derived: ChromeDerived;
  sidebar: ChromeSidebarActions;
  overlay: ChromeOverlayActions;
}): WorkspaceControllerChromeParams {
  return {
    state,
    search: derived.search,
    manualAvroSchemaRows: derived.manualAvroSchemaRows,
    manualAvroTopicNames: derived.manualAvroTopicNames,
    contextTopic: derived.contextTopic,
    contextServer: derived.contextServer,
    sidebar,
    overlay: {
      ...overlay,
      onExecuteQuickSearch: (result) => void overlay.executeQuickSearch(result)
    }
  };
}
