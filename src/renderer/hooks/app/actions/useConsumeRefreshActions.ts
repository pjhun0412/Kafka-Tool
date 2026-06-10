import { useSelectedConsumeActions } from "../../actions";
import { useWorkspaceRefreshActions } from "../../workspace";

type ConsumeRefreshActionsParams = {
  selectedConsume: Parameters<typeof useSelectedConsumeActions>[0];
  workspaceRefresh: Omit<Parameters<typeof useWorkspaceRefreshActions>[0], "updateSelectedConsumeState">;
};

export function useConsumeRefreshActions(params: ConsumeRefreshActionsParams) {
  const selectedConsumeActions = useSelectedConsumeActions(params.selectedConsume);
  const refreshActions = useWorkspaceRefreshActions({
    ...params.workspaceRefresh,
    updateSelectedConsumeState: selectedConsumeActions.updateSelectedConsumeState
  });

  return {
    selectedConsumeActions,
    refreshActions
  };
}
