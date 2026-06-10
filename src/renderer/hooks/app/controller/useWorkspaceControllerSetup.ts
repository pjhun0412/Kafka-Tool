import { useSettingsSchemaActions } from "../actions/useSettingsSchemaActions";
import { useWorkspaceMenuDismissals } from "../layout/useWorkspaceMenuDismissals";

type SettingsSchemaActionsParams = Parameters<typeof useSettingsSchemaActions>[0];

type WorkspaceControllerSetupParams = {
  menuDismissals: {
    serverContextMenuOpen: boolean;
    topicContextMenuOpen: boolean;
    topicSortMenuOpen: boolean;
    closeServerContextMenu: () => void;
    closeTopicContextMenu: () => void;
    closeTopicSortMenu: () => void;
  };
  settingsSchema: SettingsSchemaActionsParams;
};

export function useWorkspaceControllerSetup({
  menuDismissals,
  settingsSchema
}: WorkspaceControllerSetupParams) {
  useWorkspaceMenuDismissals(menuDismissals);
  return useSettingsSchemaActions(settingsSchema);
}
