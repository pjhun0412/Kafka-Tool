import { useAppStateComposition } from "../state/useAppStateComposition";
import { createConsumeFlowStateBindings } from "./stateBindings/consumeFlowStateBindings";
import { createResourceStateBindings } from "./stateBindings/resourceStateBindings";
import { createServerStateBindings } from "./stateBindings/serverStateBindings";
import { createUiStateBindings } from "./stateBindings/uiStateBindings";

export function useWorkspaceControllerStateBindings() {
  const appState = useAppStateComposition();
  const server = createServerStateBindings(appState);
  const resources = createResourceStateBindings(appState);
  const consumeFlow = createConsumeFlowStateBindings(appState);
  const ui = createUiStateBindings(appState);

  return {
    server,
    resources,
    consumeFlow,
    ui,
    ...server,
    ...resources,
    ...consumeFlow,
    ...ui
  };
}
