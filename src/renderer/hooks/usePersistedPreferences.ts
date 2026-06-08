import { useEffect } from "react";
import type { AppPreferences, KafkaApi, ManualAvroSchema } from "../../shared/types";

type PersistedPreferenceParams = {
  kafkaApi: KafkaApi | undefined;
  setStatus: (status: string) => void;
  favoriteTopicsByServer: Record<string, string[]>;
  setFavoriteTopicsByServer: (value: Record<string, string[]>) => void;
  consumeDefaultsByServer: AppPreferences["consumeDefaultsByServer"];
  setConsumeDefaultsByServer: (value: AppPreferences["consumeDefaultsByServer"]) => void;
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  setManualAvroSchemasByServer: (value: Record<string, Record<string, ManualAvroSchema>>) => void;
  preferencesLoaded: boolean;
  setPreferencesLoaded: (loaded: boolean) => void;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  serverPanelHeight: number;
  setServerPanelHeight: (height: number) => void;
  messagePaneHeight: number;
  setMessagePaneHeight: (height: number) => void;
  fontFamily: string;
  setFontFamily: (fontFamily: string) => void;
  fontSize: number;
  setFontSize: (fontSize: number) => void;
  exportFormatTemplate: string;
  setExportFormatTemplate: (template: string) => void;
};

export function usePersistedPreferences({
  kafkaApi,
  setStatus,
  favoriteTopicsByServer,
  setFavoriteTopicsByServer,
  consumeDefaultsByServer,
  setConsumeDefaultsByServer,
  manualAvroSchemasByServer,
  setManualAvroSchemasByServer,
  preferencesLoaded,
  setPreferencesLoaded,
  sidebarWidth,
  setSidebarWidth,
  sidebarCollapsed,
  setSidebarCollapsed,
  serverPanelHeight,
  setServerPanelHeight,
  messagePaneHeight,
  setMessagePaneHeight,
  fontFamily,
  setFontFamily,
  fontSize,
  setFontSize,
  exportFormatTemplate,
  setExportFormatTemplate
}: PersistedPreferenceParams) {
  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    void kafkaApi.loadPreferences().then((preferences) => {
      setFavoriteTopicsByServer(preferences.favoriteTopicsByServer ?? {});
      setConsumeDefaultsByServer(preferences.consumeDefaultsByServer ?? {});
      setManualAvroSchemasByServer(preferences.manualAvroSchemasByServer ?? {});
      if (typeof preferences.layout?.sidebarWidth === "number") {
        setSidebarWidth(preferences.layout.sidebarWidth);
      }
      if (typeof preferences.layout?.sidebarCollapsed === "boolean") {
        setSidebarCollapsed(preferences.layout.sidebarCollapsed);
      }
      if (typeof preferences.layout?.serverPanelHeight === "number") {
        setServerPanelHeight(preferences.layout.serverPanelHeight);
      }
      if (typeof preferences.layout?.messagePaneHeight === "number") {
        setMessagePaneHeight(preferences.layout.messagePaneHeight);
      }
      if (typeof preferences.appearance?.fontFamily === "string") {
        setFontFamily(preferences.appearance.fontFamily);
      }
      if (typeof preferences.appearance?.fontSize === "number") {
        setFontSize(preferences.appearance.fontSize);
      }
      if (typeof preferences.exportFormatTemplate === "string") {
        setExportFormatTemplate(preferences.exportFormatTemplate);
      }
      setPreferencesLoaded(true);
    }).catch((error) => {
      setStatus(error instanceof Error ? error.message : String(error));
      setPreferencesLoaded(true);
    });
  }, [
    kafkaApi,
    setConsumeDefaultsByServer,
    setExportFormatTemplate,
    setFavoriteTopicsByServer,
    setFontFamily,
    setFontSize,
    setManualAvroSchemasByServer,
    setMessagePaneHeight,
    setPreferencesLoaded,
    setServerPanelHeight,
    setSidebarCollapsed,
    setSidebarWidth,
    setStatus
  ]);

  useEffect(() => {
    if (!kafkaApi || !preferencesLoaded) {
      return;
    }
    void kafkaApi.savePreferences({
      favoriteTopicsByServer,
      consumeDefaultsByServer,
      manualAvroSchemasByServer,
      layout: {
        sidebarWidth,
        sidebarCollapsed,
        serverPanelHeight,
        messagePaneHeight
      },
      appearance: {
        fontFamily,
        fontSize
      },
      exportFormatTemplate
    }).catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
  }, [
    kafkaApi,
    preferencesLoaded,
    favoriteTopicsByServer,
    consumeDefaultsByServer,
    manualAvroSchemasByServer,
    sidebarWidth,
    sidebarCollapsed,
    serverPanelHeight,
    messagePaneHeight,
    fontFamily,
    fontSize,
    exportFormatTemplate,
    setStatus
  ]);
}
