import type { Dispatch, SetStateAction } from "react";
import type { ServerProfile } from "../../../shared/types";
import type { QuickSearchResult, QuickSearchScopedQuery } from "../../quickSearch";
import type { ServerForm } from "../../serverProfileForm";
import type { TopicAction } from "../../uiTypes";
import type { ManualAvroForm } from "../../hooks/useManualAvroSchemaForm";
import type { ManualAvroSchemaRow } from "../../hooks/useManualAvroSchemaSummary";
import type { PreferenceGroup, PreferencePage, PreferenceSearchMatches } from "../../hooks/usePreferenceNavigation";
import type { ServerContextMenuState, TopicContextMenuState } from "../../hooks/useSidebarInteractionState";
import { QuickSearchPalette } from "../QuickSearchPalette";
import { ConnectionErrorDialog } from "../modals/ConnectionErrorDialog";
import { ManualAvroSchemaDialog } from "../modals/ManualAvroSchemaDialog";
import { PreferencesDialog } from "../modals/PreferencesDialog";
import { ServerProfileDialog } from "../modals/ServerProfileDialog";
import { TopicActionDialog } from "../modals/TopicActionDialog";
import { WorkspaceContextMenus } from "./WorkspaceContextMenus";

type ConnectionError = {
  serverName: string;
  brokers: string;
  message: string;
};

type WorkspaceOverlaysProps = {
  isServerFormOpen: boolean;
  serverForm: ServerForm;
  editingServerId: string | null;
  loading: boolean;
  onServerForm: (form: ServerForm) => void;
  onCloseServerForm: () => void;
  onSaveServer: () => void;

  isQuickSearchOpen: boolean;
  quickSearchQuery: string;
  quickSearchResults: QuickSearchResult[];
  quickSearchIndex: number;
  connectedServerIds: string[];
  quickSearchScope: QuickSearchScopedQuery;
  onQuickSearchQuery: (query: string) => void;
  onQuickSearchIndex: (index: number) => void;
  onCloseQuickSearch: () => void;
  onExecuteQuickSearch: (result: QuickSearchResult) => void;

  isPreferencesOpen: boolean;
  activePreferencesPage: PreferencePage;
  collapsedPreferenceGroups: Record<PreferenceGroup, boolean>;
  preferencesQuery: string;
  normalizedPreferencesQuery: string;
  preferenceSearchMatches: PreferenceSearchMatches;
  fontFamily: string;
  fontSize: number;
  exportFormatTemplate: string;
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onActivePreferencesPage: (page: PreferencePage) => void;
  onTogglePreferenceGroup: (group: PreferenceGroup) => void;
  onPreferencesQuery: (query: string) => void;
  onFontFamily: (fontFamily: string) => void;
  onFontSize: (fontSize: number) => void;
  onExportFormatTemplate: Dispatch<SetStateAction<string>>;
  onOpenManualAvroFromPreferences: (serverId: string, topic: string) => void;
  onDeleteManualAvroSchemaFor: (serverId: string, topic: string) => void;
  onClosePreferences: () => void;

  isManualAvroOpen: boolean;
  manualAvroForm: ManualAvroForm;
  servers: ServerProfile[];
  manualAvroSchemasByServer: Record<string, Record<string, unknown>>;
  isSchemaDragOver: boolean;
  onManualAvroForm: Dispatch<SetStateAction<ManualAvroForm>>;
  onSchemaDragOver: (isDragOver: boolean) => void;
  onReadSchemaFile: (file?: File) => Promise<void>;
  onDeleteManualAvroSchema: () => void;
  onCloseManualAvroSchema: () => void;
  onSaveManualAvroSchema: () => void;

  connectionError: ConnectionError | null;
  onCloseConnectionError: () => void;

  pendingTopicAction: TopicAction;
  topicActionConfirmText: string;
  onTopicActionConfirmText: (text: string) => void;
  onCloseTopicAction: () => void;
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
  isServerFormOpen,
  serverForm,
  editingServerId,
  loading,
  onServerForm,
  onCloseServerForm,
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
  isPreferencesOpen,
  activePreferencesPage,
  collapsedPreferenceGroups,
  preferencesQuery,
  normalizedPreferencesQuery,
  preferenceSearchMatches,
  fontFamily,
  fontSize,
  exportFormatTemplate,
  manualAvroSchemaRows,
  onActivePreferencesPage,
  onTogglePreferenceGroup,
  onPreferencesQuery,
  onFontFamily,
  onFontSize,
  onExportFormatTemplate,
  onOpenManualAvroFromPreferences,
  onDeleteManualAvroSchemaFor,
  onClosePreferences,
  isManualAvroOpen,
  manualAvroForm,
  servers,
  manualAvroSchemasByServer,
  isSchemaDragOver,
  onManualAvroForm,
  onSchemaDragOver,
  onReadSchemaFile,
  onDeleteManualAvroSchema,
  onCloseManualAvroSchema,
  onSaveManualAvroSchema,
  connectionError,
  onCloseConnectionError,
  pendingTopicAction,
  topicActionConfirmText,
  onTopicActionConfirmText,
  onCloseTopicAction,
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
      {isServerFormOpen && (
        <ServerProfileDialog
          form={serverForm}
          editing={Boolean(editingServerId)}
          loading={loading}
          onForm={onServerForm}
          onClose={onCloseServerForm}
          onSave={onSaveServer}
        />
      )}
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
      {isPreferencesOpen && (
        <PreferencesDialog
          activePage={activePreferencesPage}
          collapsedGroups={collapsedPreferenceGroups}
          query={preferencesQuery}
          normalizedQuery={normalizedPreferencesQuery}
          matches={preferenceSearchMatches}
          fontFamily={fontFamily}
          fontSize={fontSize}
          exportFormatTemplate={exportFormatTemplate}
          manualAvroSchemaRows={manualAvroSchemaRows}
          onActivePage={onActivePreferencesPage}
          onToggleGroup={onTogglePreferenceGroup}
          onQuery={onPreferencesQuery}
          onFontFamily={onFontFamily}
          onFontSize={onFontSize}
          onExportFormatTemplate={onExportFormatTemplate}
          onOpenManualAvroSchema={onOpenManualAvroFromPreferences}
          onDeleteManualAvroSchema={onDeleteManualAvroSchemaFor}
          onClose={onClosePreferences}
        />
      )}
      {isManualAvroOpen && (
        <ManualAvroSchemaDialog
          form={manualAvroForm}
          servers={servers}
          registered={Boolean(manualAvroSchemasByServer[manualAvroForm.serverId]?.[manualAvroForm.topic])}
          isDragOver={isSchemaDragOver}
          onForm={onManualAvroForm}
          onDragOver={onSchemaDragOver}
          onReadFile={onReadSchemaFile}
          onDelete={onDeleteManualAvroSchema}
          onClose={onCloseManualAvroSchema}
          onSave={onSaveManualAvroSchema}
        />
      )}
      {connectionError && (
        <ConnectionErrorDialog
          error={connectionError}
          onClose={onCloseConnectionError}
        />
      )}
      {pendingTopicAction && (
        <TopicActionDialog
          action={pendingTopicAction}
          confirmText={topicActionConfirmText}
          loading={loading}
          onConfirmText={onTopicActionConfirmText}
          onClose={onCloseTopicAction}
          onConfirm={onConfirmTopicAction}
        />
      )}
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
