import type { Dispatch, SetStateAction } from "react";
import type { ServerProfile } from "../../../shared/types";
import type { QuickSearchResult, QuickSearchScopedQuery } from "../../quickSearch";
import type { ManualAvroSchemaRow } from "../../hooks/useManualAvroSchemaSummary";
import { usePreferenceNavigation } from "../../hooks/usePreferenceNavigation";
import type { ServerContextMenuState, TopicContextMenuState } from "../../hooks/useSidebarInteractionState";
import { useFeedbackStore } from "../../stores/ui/feedbackStore";
import { useManualAvroSchemaStore } from "../../stores/ui/manualAvroSchemaStore";
import { useServerFormStore } from "../../stores/ui/serverFormStore";
import { useSidebarInteractionStore } from "../../stores/ui/sidebarInteractionStore";
import { QuickSearchPalette } from "../QuickSearchPalette";
import { ConnectionErrorDialog } from "../modals/ConnectionErrorDialog";
import { ManualAvroSchemaDialog } from "../modals/ManualAvroSchemaDialog";
import { PreferencesDialog } from "../modals/PreferencesDialog";
import { ServerProfileDialog } from "../modals/ServerProfileDialog";
import { TopicActionDialog } from "../modals/TopicActionDialog";
import { WorkspaceContextMenus } from "./WorkspaceContextMenus";

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
  onQuickSearchIndex: (index: number) => void;
  onCloseQuickSearch: () => void;
  onExecuteQuickSearch: (result: QuickSearchResult) => void;

  fontFamily: string;
  fontSize: number;
  exportFormatTemplate: string;
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onFontFamily: (fontFamily: string) => void;
  onFontSize: (fontSize: number) => void;
  onExportFormatTemplate: Dispatch<SetStateAction<string>>;
  onOpenManualAvroSchema: (serverId: string, topic: string) => void;
  onDeleteManualAvroSchemaFor: (serverId: string, topic: string) => void;

  servers: ServerProfile[];
  manualAvroSchemasByServer: Record<string, Record<string, unknown>>;
  onReadSchemaFile: (file?: File) => Promise<void>;
  onDeleteManualAvroSchema: () => void;
  onSaveManualAvroSchema: () => void;

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
  exportFormatTemplate,
  manualAvroSchemaRows,
  onFontFamily,
  onFontSize,
  onExportFormatTemplate,
  onOpenManualAvroSchema,
  onDeleteManualAvroSchemaFor,
  servers,
  manualAvroSchemasByServer,
  onReadSchemaFile,
  onDeleteManualAvroSchema,
  onSaveManualAvroSchema,
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
  const isServerFormOpen = useServerFormStore((state) => state.isServerFormOpen);
  const serverForm = useServerFormStore((state) => state.serverForm);
  const editingServerId = useServerFormStore((state) => state.editingServerId);
  const setServerForm = useServerFormStore((state) => state.setServerForm);
  const closeServerForm = useServerFormStore((state) => state.closeServerForm);
  const isManualAvroOpen = useManualAvroSchemaStore((state) => state.isManualAvroOpen);
  const manualAvroForm = useManualAvroSchemaStore((state) => state.manualAvroForm);
  const setManualAvroForm = useManualAvroSchemaStore((state) => state.setManualAvroForm);
  const isSchemaDragOver = useManualAvroSchemaStore((state) => state.isSchemaDragOver);
  const setIsSchemaDragOver = useManualAvroSchemaStore((state) => state.setIsSchemaDragOver);
  const closeManualAvroForm = useManualAvroSchemaStore((state) => state.closeManualAvroForm);
  const connectionError = useFeedbackStore((state) => state.connectionError);
  const setConnectionError = useFeedbackStore((state) => state.setConnectionError);
  const pendingTopicAction = useSidebarInteractionStore((state) => state.pendingTopicAction);
  const topicActionConfirmText = useSidebarInteractionStore((state) => state.topicActionConfirmText);
  const setPendingTopicAction = useSidebarInteractionStore((state) => state.setPendingTopicAction);
  const setTopicActionConfirmText = useSidebarInteractionStore((state) => state.setTopicActionConfirmText);
  const {
    isPreferencesOpen,
    setIsPreferencesOpen,
    activePreferencesPage,
    setActivePreferencesPage,
    collapsedPreferenceGroups,
    preferencesQuery,
    setPreferencesQuery,
    normalizedPreferencesQuery,
    preferenceSearchMatches,
    togglePreferenceGroup
  } = usePreferenceNavigation();

  return (
    <>
      {isServerFormOpen && (
        <ServerProfileDialog
          form={serverForm}
          editing={Boolean(editingServerId)}
          loading={loading}
          onForm={setServerForm}
          onClose={closeServerForm}
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
          onActivePage={setActivePreferencesPage}
          onToggleGroup={togglePreferenceGroup}
          onQuery={setPreferencesQuery}
          onFontFamily={onFontFamily}
          onFontSize={onFontSize}
          onExportFormatTemplate={onExportFormatTemplate}
          onOpenManualAvroSchema={(serverId, topic) => {
            setIsPreferencesOpen(false);
            onOpenManualAvroSchema(serverId, topic);
          }}
          onDeleteManualAvroSchema={onDeleteManualAvroSchemaFor}
          onClose={() => setIsPreferencesOpen(false)}
        />
      )}
      {isManualAvroOpen && (
        <ManualAvroSchemaDialog
          form={manualAvroForm}
          servers={servers}
          registered={Boolean(manualAvroSchemasByServer[manualAvroForm.serverId]?.[manualAvroForm.topic])}
          isDragOver={isSchemaDragOver}
          onForm={setManualAvroForm}
          onDragOver={setIsSchemaDragOver}
          onReadFile={onReadSchemaFile}
          onDelete={onDeleteManualAvroSchema}
          onClose={closeManualAvroForm}
          onSave={onSaveManualAvroSchema}
        />
      )}
      {connectionError && (
        <ConnectionErrorDialog
          error={connectionError}
          onClose={() => setConnectionError(null)}
        />
      )}
      {pendingTopicAction && (
        <TopicActionDialog
          action={pendingTopicAction}
          confirmText={topicActionConfirmText}
          loading={loading}
          onConfirmText={setTopicActionConfirmText}
          onClose={() => setPendingTopicAction(null)}
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
