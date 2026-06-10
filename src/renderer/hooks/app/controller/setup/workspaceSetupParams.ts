import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerSetupParams } from "../useWorkspaceControllerSetup";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

export function createWorkspaceSetupParams(state: ControllerState): WorkspaceControllerSetupParams {
  return {
    menuDismissals: {
      serverContextMenuOpen: Boolean(state.serverContextMenu),
      topicContextMenuOpen: Boolean(state.topicContextMenu),
      topicSortMenuOpen: state.isTopicSortMenuOpen,
      closeServerContextMenu: state.closeServerContextMenu,
      closeTopicContextMenu: state.closeTopicContextMenu,
      closeTopicSortMenu: () => state.setIsTopicSortMenuOpen(false)
    },
    settingsSchema: {
      manualAvroSchema: {
        manualAvroSchemasByServer: state.manualAvroSchemasByServer,
        setManualAvroSchemasByServer: state.setManualAvroSchemasByServer,
        setToast: state.setToast
      },
      settingsTransfer: {
        kafkaApi: window.kafkaApi,
        setLoading: state.setLoading,
        setStatus: state.setStatus,
        setToast: state.setToast
      }
    }
  };
}
