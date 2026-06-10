import { useConsumeRefreshActions } from "../actions/useConsumeRefreshActions";
import { useManualAvroSchemaComposition } from "../actions/useManualAvroSchemaComposition";
import { usePrimaryTopicTabAppActions } from "../actions/usePrimaryTopicTabAppActions";
import { useQuickSearchAppActions } from "../actions/useQuickSearchAppActions";

type QuickSearchActionsParams = Parameters<typeof useQuickSearchAppActions>[0];
type ManualAvroSchemaParams = Parameters<typeof useManualAvroSchemaComposition>[0];
type ConsumeRefreshActionsParams = Parameters<typeof useConsumeRefreshActions>[0];
type PrimaryTopicTabActionsParams = Parameters<typeof usePrimaryTopicTabAppActions>[0];

type WorkspaceControllerInteractionsParams = {
  quickSearch: QuickSearchActionsParams;
  manualAvroSchemas: ManualAvroSchemaParams;
  consumeRefresh: ConsumeRefreshActionsParams;
  primaryTopicTab: PrimaryTopicTabActionsParams;
};

export function useWorkspaceControllerInteractions({
  quickSearch,
  manualAvroSchemas,
  consumeRefresh,
  primaryTopicTab
}: WorkspaceControllerInteractionsParams) {
  const { executeQuickSearch } = useQuickSearchAppActions(quickSearch);
  const { manualAvroTopicNames, manualAvroSchemaRows } = useManualAvroSchemaComposition(manualAvroSchemas);
  const { selectedConsumeActions, refreshActions } = useConsumeRefreshActions(consumeRefresh);
  const { closeTopicTab } = usePrimaryTopicTabAppActions(primaryTopicTab);

  return {
    closeTopicTab,
    executeQuickSearch,
    manualAvroSchemaRows,
    manualAvroTopicNames,
    refreshActions,
    selectedConsumeActions
  };
}
