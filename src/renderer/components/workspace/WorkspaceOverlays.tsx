import type { Dispatch, SetStateAction } from "react";
import type { AppKeyboardShortcutPreferences, ServerProfile, TopicCreateRequest } from "../../../shared/types";
import type { AppLanguage, LanguagePreference } from "../../i18n";
import type { KeyboardShortcutMap } from "../../keyboardShortcuts";
import type { QuickSearchResult, QuickSearchScopedQuery } from "../../quickSearch";
import type { ManualAvroSchemaRow } from "../../hooks/preferences/useManualAvroSchemaSummary";
import type { ServerContextMenuState, TopicContextMenuState } from "../../hooks/state/useSidebarInteractionState";
import { QuickSearchPalette } from "../QuickSearchPalette";
import { WorkspaceContextMenus } from "./WorkspaceContextMenus";
import { WorkspaceDialogs } from "./WorkspaceDialogs";

type WorkspaceOverlaysProps = {
  loading: boolean;
  onSaveServer: () => void;

  isQuickSearchOpen: boolean;
  quickSearchQuery: string;
  quickSearchResults: QuickSearchResult[];
  quickSearchIndex: number;
  connectedServerIds: string[];
  quickSearchScope: QuickSearchScopedQuery;
  onQuickSearchQuery: (query: string) => void;
  onQuickSearchIndex: (index: number | ((current: number) => number)) => void;
  onCloseQuickSearch: () => void;
  onExecuteQuickSearch: (result: QuickSearchResult) => void;

  fontFamily: string;
  fontSize: number;
  language: LanguagePreference;
  resolvedLanguage: AppLanguage;
  exportFormatTemplate: string;
  keyboardShortcuts: KeyboardShortcutMap;
  appVersion: string;
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onFontFamily: (fontFamily: string) => void;
  onFontSize: (fontSize: number) => void;
  onLanguage: (language: LanguagePreference) => void;
  onExportFormatTemplate: Dispatch<SetStateAction<string>>;
  onKeyboardShortcuts: Dispatch<SetStateAction<AppKeyboardShortcutPreferences>>;
  onLastSeenReleaseVersion: (version: string) => void;
  onOpenManualAvroSchema: (serverId: string, topic: string) => void;
  onDeleteManualAvroSchemaFor: (serverId: string, topic: string) => void;

  servers: ServerProfile[];
  manualAvroSchemasByServer: Record<string, Record<string, unknown>>;
  onReadSchemaFile: (file?: File) => Promise<void>;
  onDeleteManualAvroSchema: () => void;
  onSaveManualAvroSchema: () => void;
  onCreateTopic: (request: TopicCreateRequest) => Promise<void>;

  onConfirmTopicAction: () => void;

  topicContextMenu: TopicContextMenuState;
  serverContextMenu: ServerContextMenuState;
  contextTopic: string;
  contextServer: ServerProfile | undefined;
  selectedServerId: string;
  onCloseTopicMenu: () => void;
  onOpenTopic: (topic: string) => void;
  onCopyTopic: (topic: string) => void;
  onRegisterAvroSchema: (serverId: string, topic: string) => void;
  onTopicAction: (kind: "delete" | "purge", topics?: string[]) => void;
  onCloseServerMenu: () => void;
  onConnectServer: (server: ServerProfile) => void;
  onDisconnectServer: (serverId: string) => void;
  onEditServer: (server: ServerProfile) => void;
  onDeleteServer: (serverId: string) => void;
};

export function WorkspaceOverlays({
  loading,
  onSaveServer,
  isQuickSearchOpen,
  quickSearchQuery,
  quickSearchResults,
  quickSearchIndex,
  connectedServerIds,
  quickSearchScope,
  onQuickSearchQuery,
  onQuickSearchIndex,
  onCloseQuickSearch,
  onExecuteQuickSearch,
  fontFamily,
  fontSize,
  language,
  resolvedLanguage,
  exportFormatTemplate,
  keyboardShortcuts,
  appVersion,
  manualAvroSchemaRows,
  onFontFamily,
  onFontSize,
  onLanguage,
  onExportFormatTemplate,
  onKeyboardShortcuts,
  onLastSeenReleaseVersion,
  onOpenManualAvroSchema,
  onDeleteManualAvroSchemaFor,
  servers,
  manualAvroSchemasByServer,
  onReadSchemaFile,
  onDeleteManualAvroSchema,
  onSaveManualAvroSchema,
  onCreateTopic,
  onConfirmTopicAction,
  topicContextMenu,
  serverContextMenu,
  contextTopic,
  contextServer,
  selectedServerId,
  onCloseTopicMenu,
  onOpenTopic,
  onCopyTopic,
  onRegisterAvroSchema,
  onTopicAction,
  onCloseServerMenu,
  onConnectServer,
  onDisconnectServer,
  onEditServer,
  onDeleteServer
}: WorkspaceOverlaysProps) {
  return (
    <>
      <QuickSearchPalette
        open={isQuickSearchOpen}
        query={quickSearchQuery}
        results={quickSearchResults}
        selectedIndex={quickSearchIndex}
        connectedServerIds={connectedServerIds}
        scope={quickSearchScope}
        onQuery={onQuickSearchQuery}
        onIndex={onQuickSearchIndex}
        onClose={onCloseQuickSearch}
        onExecute={onExecuteQuickSearch}
      />
      <WorkspaceDialogs
        loading={loading}
        onSaveServer={onSaveServer}
        fontFamily={fontFamily}
        fontSize={fontSize}
        language={language}
        resolvedLanguage={resolvedLanguage}
        exportFormatTemplate={exportFormatTemplate}
        keyboardShortcuts={keyboardShortcuts}
        appVersion={appVersion}
        manualAvroSchemaRows={manualAvroSchemaRows}
        onFontFamily={onFontFamily}
        onFontSize={onFontSize}
        onLanguage={onLanguage}
        onExportFormatTemplate={onExportFormatTemplate}
        onKeyboardShortcuts={onKeyboardShortcuts}
        onLastSeenReleaseVersion={onLastSeenReleaseVersion}
        onOpenManualAvroSchema={onOpenManualAvroSchema}
        onDeleteManualAvroSchemaFor={onDeleteManualAvroSchemaFor}
        servers={servers}
        manualAvroSchemasByServer={manualAvroSchemasByServer}
        onReadSchemaFile={onReadSchemaFile}
        onDeleteManualAvroSchema={onDeleteManualAvroSchema}
        onSaveManualAvroSchema={onSaveManualAvroSchema}
        onCreateTopic={onCreateTopic}
        onConfirmTopicAction={onConfirmTopicAction}
      />
      <WorkspaceContextMenus
        topicContextMenu={topicContextMenu}
        serverContextMenu={serverContextMenu}
        contextTopic={contextTopic}
        contextServer={contextServer}
        selectedServerId={selectedServerId}
        connectedServerIds={connectedServerIds}
        onCloseTopicMenu={onCloseTopicMenu}
        onOpenTopic={onOpenTopic}
        onCopyTopic={onCopyTopic}
        onRegisterAvroSchema={onRegisterAvroSchema}
        onTopicAction={onTopicAction}
        onCloseServerMenu={onCloseServerMenu}
        onConnectServer={onConnectServer}
        onDisconnectServer={onDisconnectServer}
        onEditServer={onEditServer}
        onDeleteServer={onDeleteServer}
      />
    </>
  );
}
