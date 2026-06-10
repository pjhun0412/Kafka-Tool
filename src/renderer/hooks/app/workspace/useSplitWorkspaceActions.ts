import { useSplitPaneActions, useSplitPaneViewActions } from "../../workspace";

type SplitWorkspaceActionsParams = {
  view: Parameters<typeof useSplitPaneViewActions>[0];
  pane: Parameters<typeof useSplitPaneActions>[0];
};

export function useSplitWorkspaceActions(params: SplitWorkspaceActionsParams) {
  const viewActions = useSplitPaneViewActions(params.view);
  const paneActions = useSplitPaneActions(params.pane);

  return {
    viewActions,
    paneActions
  };
}
