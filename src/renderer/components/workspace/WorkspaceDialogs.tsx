import type { Dispatch, SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import type { AppKeyboardShortcutPreferences, ServerProfile, TopicCreateRequest } from "../../../shared/types";
import type { AppLanguage, LanguagePreference } from "../../i18n";
import type { KeyboardShortcutMap } from "../../keyboardShortcuts";
import type { ManualAvroSchemaRow } from "../../hooks/preferences/useManualAvroSchemaSummary";
import { usePreferenceNavigation } from "../../hooks/preferences/usePreferenceNavigation";
import { useFeedbackStore } from "../../stores/ui/feedbackStore";
import { useManualAvroSchemaStore } from "../../stores/ui/manualAvroSchemaStore";
import { useReleaseNotesStore } from "../../stores/ui/releaseNotesStore";
import { useServerFormStore } from "../../stores/ui/serverFormStore";
import { useSidebarInteractionStore } from "../../stores/ui/sidebarInteractionStore";
import { useTopicCreateStore } from "../../stores/ui/topicCreateStore";
import { ConnectionErrorDialog } from "../modals/ConnectionErrorDialog";
import { ManualAvroSchemaDialog } from "../modals/ManualAvroSchemaDialog";
import { PreferencesDialog } from "../modals/PreferencesDialog";
import { ReleaseNotesDialog } from "../modals/ReleaseNotesDialog";
import { ServerProfileDialog } from "../modals/ServerProfileDialog";
import { TopicActionDialog } from "../modals/TopicActionDialog";
import { TopicCreateDialog } from "../modals/TopicCreateDialog";

export function WorkspaceDialogs(props: {
  loading: boolean;
  onSaveServer: () => void;
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
}) {
  const {
    isServerFormOpen,
    serverForm,
    editingServerId,
    setServerForm,
    closeServerForm
  } = useServerFormStore(useShallow((state) => ({
    isServerFormOpen: state.isServerFormOpen,
    serverForm: state.serverForm,
    editingServerId: state.editingServerId,
    setServerForm: state.setServerForm,
    closeServerForm: state.closeServerForm
  })));
  const {
    isManualAvroOpen,
    manualAvroForm,
    setManualAvroForm,
    isSchemaDragOver,
    setIsSchemaDragOver,
    closeManualAvroForm
  } = useManualAvroSchemaStore(useShallow((state) => ({
    isManualAvroOpen: state.isManualAvroOpen,
    manualAvroForm: state.manualAvroForm,
    setManualAvroForm: state.setManualAvroForm,
    isSchemaDragOver: state.isSchemaDragOver,
    setIsSchemaDragOver: state.setIsSchemaDragOver,
    closeManualAvroForm: state.closeManualAvroForm
  })));
  const {
    isTopicCreateOpen,
    topicCreateForm,
    setTopicCreateForm,
    closeTopicCreateForm
  } = useTopicCreateStore(useShallow((state) => ({
    isTopicCreateOpen: state.isTopicCreateOpen,
    topicCreateForm: state.topicCreateForm,
    setTopicCreateForm: state.setTopicCreateForm,
    closeTopicCreateForm: state.closeTopicCreateForm
  })));
  const { connectionError, setConnectionError } = useFeedbackStore(useShallow((state) => ({
    connectionError: state.connectionError,
    setConnectionError: state.setConnectionError
  })));
  const {
    pendingTopicAction,
    topicActionConfirmText,
    setPendingTopicAction,
    setTopicActionConfirmText
  } = useSidebarInteractionStore(useShallow((state) => ({
    pendingTopicAction: state.pendingTopicAction,
    topicActionConfirmText: state.topicActionConfirmText,
    setPendingTopicAction: state.setPendingTopicAction,
    setTopicActionConfirmText: state.setTopicActionConfirmText
  })));
  const {
    isReleaseNotesOpen,
    releaseNotesVersion,
    closeReleaseNotes
  } = useReleaseNotesStore(useShallow((state) => ({
    isReleaseNotesOpen: state.isReleaseNotesOpen,
    releaseNotesVersion: state.releaseNotesVersion,
    closeReleaseNotes: state.closeReleaseNotes
  })));
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
          loading={props.loading}
          onForm={setServerForm}
          onClose={closeServerForm}
          onSave={props.onSaveServer}
        />
      )}
      {isPreferencesOpen && (
        <PreferencesDialog
          activePage={activePreferencesPage}
          collapsedGroups={collapsedPreferenceGroups}
          query={preferencesQuery}
          normalizedQuery={normalizedPreferencesQuery}
          matches={preferenceSearchMatches}
          fontFamily={props.fontFamily}
          fontSize={props.fontSize}
          language={props.language}
          resolvedLanguage={props.resolvedLanguage}
          exportFormatTemplate={props.exportFormatTemplate}
          keyboardShortcuts={props.keyboardShortcuts}
          manualAvroSchemaRows={props.manualAvroSchemaRows}
          onActivePage={setActivePreferencesPage}
          onToggleGroup={togglePreferenceGroup}
          onQuery={setPreferencesQuery}
          onFontFamily={props.onFontFamily}
          onFontSize={props.onFontSize}
          onLanguage={props.onLanguage}
          onExportFormatTemplate={props.onExportFormatTemplate}
          onKeyboardShortcuts={props.onKeyboardShortcuts}
          onOpenManualAvroSchema={(serverId, topic) => {
            setIsPreferencesOpen(false);
            props.onOpenManualAvroSchema(serverId, topic);
          }}
          onDeleteManualAvroSchema={props.onDeleteManualAvroSchemaFor}
          onClose={() => setIsPreferencesOpen(false)}
        />
      )}
      {isReleaseNotesOpen && (
        <ReleaseNotesDialog
          version={releaseNotesVersion || props.appVersion}
          language={props.resolvedLanguage}
          onClose={() => {
            const version = releaseNotesVersion || props.appVersion;
            if (version) props.onLastSeenReleaseVersion(version);
            closeReleaseNotes();
          }}
        />
      )}
      {isManualAvroOpen && (
        <ManualAvroSchemaDialog
          form={manualAvroForm}
          servers={props.servers}
          registered={Boolean(props.manualAvroSchemasByServer[manualAvroForm.serverId]?.[manualAvroForm.topic])}
          isDragOver={isSchemaDragOver}
          onForm={setManualAvroForm}
          onDragOver={setIsSchemaDragOver}
          onReadFile={props.onReadSchemaFile}
          onDelete={props.onDeleteManualAvroSchema}
          onClose={closeManualAvroForm}
          onSave={props.onSaveManualAvroSchema}
        />
      )}
      {connectionError && (
        <ConnectionErrorDialog
          error={connectionError}
          onClose={() => setConnectionError(null)}
        />
      )}
      {isTopicCreateOpen && (
        <TopicCreateDialog
          form={topicCreateForm}
          loading={props.loading}
          onForm={setTopicCreateForm}
          onClose={closeTopicCreateForm}
          onCreate={() => {
            const configs = [
              { name: "cleanup.policy", value: topicCreateForm.cleanupPolicy },
              { name: "min.insync.replicas", value: topicCreateForm.minInSyncReplicas },
              { name: "retention.ms", value: topicCreateForm.retentionMs },
              { name: "retention.bytes", value: topicCreateForm.retentionBytes },
              { name: "max.message.bytes", value: topicCreateForm.maxMessageBytes },
              ...topicCreateForm.configs
            ].filter((config) => config.name.trim() && config.value.trim());
            props.onCreateTopic({
              serverId: topicCreateForm.serverId,
              topic: topicCreateForm.topic,
              partitions: Number(topicCreateForm.partitions),
              replicationFactor: Number(topicCreateForm.replicationFactor),
              configs
            });
          }}
        />
      )}
      {pendingTopicAction && (
        <TopicActionDialog
          action={pendingTopicAction}
          confirmText={topicActionConfirmText}
          loading={props.loading}
          onConfirmText={setTopicActionConfirmText}
          onClose={() => setPendingTopicAction(null)}
          onConfirm={props.onConfirmTopicAction}
        />
      )}
    </>
  );
}
