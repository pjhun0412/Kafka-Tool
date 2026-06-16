import { useEffect } from "react";
import type { AppPreferences, KafkaApi, ManualAvroSchema } from "../../../shared/types";
import { INTER_FONT_FAMILY, LEGACY_DEFAULT_FONT_FAMILY, LEGACY_INTER_FONT_FAMILY } from "../../fontConfig";
import { normalizeLanguagePreference, type LanguagePreference } from "../../i18n";
import { useReleaseNotesStore } from "../../stores/ui/releaseNotesStore";
import { pruneViewerPreferences, type ViewerPreferences } from "../../viewerPreferences";

type PersistedPreferenceParams = {
  kafkaApi: KafkaApi | undefined;
  setStatus: (status: string) => void;
  favoriteTopicsByServer: Record<string, string[]>;
  setFavoriteTopicsByServer: (value: Record<string, string[]>) => void;
  consumeDefaults: NonNullable<AppPreferences["consumeDefaults"]>;
  setConsumeDefaults: (value: NonNullable<AppPreferences["consumeDefaults"]>) => void;
  viewerPreferences: Required<ViewerPreferences>;
  setViewerPreferences: (value: Required<ViewerPreferences>) => void;
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
  language: LanguagePreference;
  setLanguage: (language: LanguagePreference) => void;
  exportFormatTemplate: string;
  setExportFormatTemplate: (template: string) => void;
  keyboardShortcuts: NonNullable<AppPreferences["keyboardShortcuts"]>;
  setKeyboardShortcuts: (shortcuts: NonNullable<AppPreferences["keyboardShortcuts"]>) => void;
  logRetentionDays: number;
  setLogRetentionDays: (days: number) => void;
  appVersion: string;
  setAppVersion: (version: string) => void;
  lastSeenReleaseVersion: string;
  setLastSeenReleaseVersion: (version: string) => void;
};

function normalizeStoredFontFamily(fontFamily: string) {
  return fontFamily === LEGACY_DEFAULT_FONT_FAMILY || fontFamily === LEGACY_INTER_FONT_FAMILY
    ? INTER_FONT_FAMILY
    : fontFamily;
}

export function usePersistedPreferences({
  kafkaApi,
  setStatus,
  favoriteTopicsByServer,
  setFavoriteTopicsByServer,
  consumeDefaults,
  setConsumeDefaults,
  viewerPreferences,
  setViewerPreferences,
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
  language,
  setLanguage,
  exportFormatTemplate,
  setExportFormatTemplate,
  keyboardShortcuts,
  setKeyboardShortcuts,
  logRetentionDays,
  setLogRetentionDays,
  appVersion,
  setAppVersion,
  lastSeenReleaseVersion,
  setLastSeenReleaseVersion
}: PersistedPreferenceParams) {
  const openReleaseNotes = useReleaseNotesStore((state) => state.openReleaseNotes);

  useEffect(() => {
    if (!kafkaApi) {
      return;
    }
    void Promise.all([kafkaApi.loadPreferences(), kafkaApi.getAppVersion()]).then(([preferences, version]) => {
      setAppVersion(version);
      setFavoriteTopicsByServer(preferences.favoriteTopicsByServer ?? {});
      setConsumeDefaults(preferences.consumeDefaults ?? {});
      setViewerPreferences(pruneViewerPreferences(preferences.viewerPreferences));
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
        setFontFamily(normalizeStoredFontFamily(preferences.appearance.fontFamily));
      }
      if (typeof preferences.appearance?.fontSize === "number") {
        setFontSize(preferences.appearance.fontSize);
      }
      setLanguage(normalizeLanguagePreference(preferences.appearance?.language));
      if (typeof preferences.exportFormatTemplate === "string") {
        setExportFormatTemplate(preferences.exportFormatTemplate);
      }
      setKeyboardShortcuts(preferences.keyboardShortcuts ?? {});
      if (typeof preferences.diagnostics?.logRetentionDays === "number") {
        setLogRetentionDays(preferences.diagnostics.logRetentionDays);
      }
      const seenVersion = preferences.releaseNotes?.lastSeenVersion ?? "";
      setLastSeenReleaseVersion(seenVersion);
      if (version && seenVersion !== version) {
        openReleaseNotes(version);
      }
      setPreferencesLoaded(true);
    }).catch((error) => {
      setStatus(error instanceof Error ? error.message : String(error));
      setPreferencesLoaded(true);
    });
  }, [
    kafkaApi,
    setConsumeDefaults,
    setViewerPreferences,
    setConsumeDefaultsByServer,
    setExportFormatTemplate,
    setFavoriteTopicsByServer,
    setFontFamily,
    setFontSize,
    setAppVersion,
    setLanguage,
    setKeyboardShortcuts,
    setLogRetentionDays,
    setLastSeenReleaseVersion,
    setManualAvroSchemasByServer,
    setMessagePaneHeight,
    setPreferencesLoaded,
    setServerPanelHeight,
    setSidebarCollapsed,
    setSidebarWidth,
    setStatus,
    openReleaseNotes
  ]);

  useEffect(() => {
    if (!kafkaApi || !preferencesLoaded) {
      return;
    }
    void kafkaApi.savePreferences({
      favoriteTopicsByServer,
      consumeDefaults,
      viewerPreferences: pruneViewerPreferences(viewerPreferences),
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
        fontSize,
        language
      },
      keyboardShortcuts,
      diagnostics: {
        logRetentionDays
      },
      releaseNotes: {
        lastSeenVersion: lastSeenReleaseVersion
      },
      exportFormatTemplate
    }).catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
  }, [
    kafkaApi,
    preferencesLoaded,
    favoriteTopicsByServer,
    consumeDefaults,
    viewerPreferences,
    consumeDefaultsByServer,
    manualAvroSchemasByServer,
    sidebarWidth,
    sidebarCollapsed,
    serverPanelHeight,
    messagePaneHeight,
    fontFamily,
    fontSize,
    language,
    keyboardShortcuts,
    logRetentionDays,
    lastSeenReleaseVersion,
    exportFormatTemplate,
    setStatus
  ]);
}
