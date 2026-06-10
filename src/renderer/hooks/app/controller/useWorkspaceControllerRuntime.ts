import { useAppRuntimeEffects } from "../layout/useAppRuntimeEffects";

type RuntimeEffectsParams = Parameters<typeof useAppRuntimeEffects>[0];

export type WorkspaceControllerRuntimeParams = {
  kafkaApi: RuntimeEffectsParams["serverBootstrap"]["kafkaApi"];
  state: Omit<RuntimeEffectsParams["serverBootstrap"], "kafkaApi"> &
    Omit<RuntimeEffectsParams["persistedPreferences"], "kafkaApi"> &
    Omit<RuntimeEffectsParams["serverHealthMonitor"], "kafkaApi"> &
    Omit<RuntimeEffectsParams["electronMenuEvents"], "kafkaApi" | "language" | "applyImportedSettings"> &
    Omit<RuntimeEffectsParams["kafkaConsumeEvents"], "kafkaApi"> &
    Pick<RuntimeEffectsParams["selectedServerResources"], "selectedServerId" | "connectedServerIds" | "topicsByServer" | "brokersByServer" | "groupsByServer">;
  applyImportedSettings: RuntimeEffectsParams["electronMenuEvents"]["applyImportedSettings"];
  language: RuntimeEffectsParams["electronMenuEvents"]["language"];
  selectedServerResources: Omit<
    RuntimeEffectsParams["selectedServerResources"],
    "selectedServerId" | "connectedServerIds" | "topicsByServer" | "brokersByServer" | "groupsByServer"
  >;
};

export function useWorkspaceControllerRuntime({
  kafkaApi,
  state,
  applyImportedSettings,
  language,
  selectedServerResources
}: WorkspaceControllerRuntimeParams) {
  useAppRuntimeEffects({
    serverBootstrap: {
      kafkaApi,
      setStatus: state.setStatus,
      setServers: state.setServers,
      setSelectedServerId: state.setSelectedServerId
    },
    persistedPreferences: {
      kafkaApi,
      setStatus: state.setStatus,
      favoriteTopicsByServer: state.favoriteTopicsByServer,
      setFavoriteTopicsByServer: state.setFavoriteTopicsByServer,
      consumeDefaultsByServer: state.consumeDefaultsByServer,
      setConsumeDefaultsByServer: state.setConsumeDefaultsByServer,
      manualAvroSchemasByServer: state.manualAvroSchemasByServer,
      setManualAvroSchemasByServer: state.setManualAvroSchemasByServer,
      preferencesLoaded: state.preferencesLoaded,
      setPreferencesLoaded: state.setPreferencesLoaded,
      sidebarWidth: state.sidebarWidth,
      setSidebarWidth: state.setSidebarWidth,
      sidebarCollapsed: state.sidebarCollapsed,
      setSidebarCollapsed: state.setSidebarCollapsed,
      serverPanelHeight: state.serverPanelHeight,
      setServerPanelHeight: state.setServerPanelHeight,
      messagePaneHeight: state.messagePaneHeight,
      setMessagePaneHeight: state.setMessagePaneHeight,
      fontFamily: state.fontFamily,
      setFontFamily: state.setFontFamily,
      fontSize: state.fontSize,
      setFontSize: state.setFontSize,
      language: state.language,
      setLanguage: state.setLanguage,
      exportFormatTemplate: state.exportFormatTemplate,
      setExportFormatTemplate: state.setExportFormatTemplate
    },
    serverHealthMonitor: {
      kafkaApi,
      servers: state.servers,
      connectedServerIds: state.connectedServerIds,
      failedServerIds: state.failedServerIds,
      openClusterIds: state.openClusterIds,
      setConnectedServerIds: state.setConnectedServerIds,
      setFailedServerIds: state.setFailedServerIds,
      setHealthFailuresByServer: state.setHealthFailuresByServer,
      setStatus: state.setStatus,
      setToast: state.setToast
    },
    electronMenuEvents: {
      kafkaApi,
      language,
      openPreferencesSection: state.openPreferencesSection,
      applyImportedSettings,
      setStatus: state.setStatus,
      setToast: state.setToast
    },
    kafkaConsumeEvents: {
      kafkaApi,
      selectedServerId: state.selectedServerId,
      consumeDefaultsByServer: state.consumeDefaultsByServer,
      getDefaultConsumeState: state.getDefaultConsumeState,
      getMessageTarget: state.getMessageTarget,
      mergeConsumeState: state.mergeConsumeState,
      setConsumeStatesByServer: state.setConsumeStatesByServer,
      setSplitConsumeStatesByServer: state.setSplitConsumeStatesByServer,
      setStatus: state.setStatus
    },
    selectedServerResources: {
      selectedServerId: state.selectedServerId,
      connectedServerIds: state.connectedServerIds,
      topicsByServer: state.topicsByServer,
      brokersByServer: state.brokersByServer,
      groupsByServer: state.groupsByServer,
      ...selectedServerResources
    }
  });
}
