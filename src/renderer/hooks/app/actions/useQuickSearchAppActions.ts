import { useQuickSearchActions } from "../../search";
import { useAppKeyboardShortcuts } from "../../ui";

type QuickSearchAppActionsParams = {
  actions: Parameters<typeof useQuickSearchActions>[0];
  shortcuts: Parameters<typeof useAppKeyboardShortcuts>[0];
};

export function useQuickSearchAppActions(params: QuickSearchAppActionsParams) {
  const quickSearchActions = useQuickSearchActions(params.actions);
  useAppKeyboardShortcuts(params.shortcuts);

  return quickSearchActions;
}
