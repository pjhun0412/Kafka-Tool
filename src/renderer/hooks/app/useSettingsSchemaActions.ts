import { useManualAvroSchemaActions, useSettingsTransferActions } from "../actions";

type SettingsSchemaActionsParams = {
  manualAvroSchema: Parameters<typeof useManualAvroSchemaActions>[0];
  settingsTransfer: Parameters<typeof useSettingsTransferActions>[0];
};

export function useSettingsSchemaActions(params: SettingsSchemaActionsParams) {
  const manualAvroSchemaActions = useManualAvroSchemaActions(params.manualAvroSchema);
  const settingsTransferActions = useSettingsTransferActions(params.settingsTransfer);

  return {
    manualAvroSchemaActions,
    settingsTransferActions
  };
}
