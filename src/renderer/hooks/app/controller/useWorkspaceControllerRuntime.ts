import { useAppRuntimeEffects } from "../layout/useAppRuntimeEffects";

type RuntimeEffectsParams = Parameters<typeof useAppRuntimeEffects>[0];

export type WorkspaceControllerRuntimeParams = {
  kafkaApi: RuntimeEffectsParams["serverBootstrap"]["kafkaApi"];
  state: Omit<RuntimeEffectsParams["serverBootstrap"], "kafkaApi"> &
    Omit<RuntimeEffectsParams["persistedPreferences"], "kafkaApi"> &
    Omit<RuntimeEffectsParams["serverHealthMonitor"], "kafkaApi"> &
    Omit<RuntimeEffectsParams["electronMenuEvents"], "kafkaApi" | "language" | "applyImportedSettings" | "importSettings" | "exportSettings"> &
    Omit<RuntimeEffectsParams["kafkaConsumeEvents"], "kafkaApi"> &
    Pick<RuntimeEffectsParams["selectedServerResources"], "selectedServerId" | "connectedServerIds" | "topicsByServer" | "brokersByServer" | "groupsByServer">;
  applyImportedSettings: RuntimeEffectsParams["electronMenuEvents"]["applyImportedSettings"];
  importSettings: RuntimeEffectsParams["electronMenuEvents"]["importSettings"];
  exportSettings: RuntimeEffectsParams["electronMenuEvents"]["exportSettings"];
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
  importSettings,
  exportSettings,
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
      consumeDefaults: state.consumeDefaults,
      setConsumeDefaults: state.setConsumeDefaults,
      viewerPreferences: state.viewerPreferences,
      setViewerPreferences: state.setViewerPreferences,
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
      setExportFormatTemplate: state.setExportFormatTemplate,
      keyboardShortcuts: state.keyboardShortcuts,
      setKeyboardShortcuts: state.setKeyboardShortcuts,
      logRetentionDays: state.logRetentionDays,
      setLogRetentionDays: state.setLogRetentionDays,
      appVersion: state.appVersion,
      setAppVersion: state.setAppVersion,
      lastSeenReleaseVersion: state.lastSeenReleaseVersion,
      setLastSeenReleaseVersion: state.setLastSeenReleaseVersion
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
      appVersion: state.appVersion,
      openPreferencesSection: state.openPreferencesSection,
      applyImportedSettings,
      importSettings,
      exportSettings,
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
