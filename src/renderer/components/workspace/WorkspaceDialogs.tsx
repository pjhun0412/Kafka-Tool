import type { Dispatch, SetStateAction } from "react";
import { useShallow } from "zustand/react/shallow";
import type { ServerProfile } from "../../../shared/types";
import type { ManualAvroSchemaRow } from "../../hooks/preferences/useManualAvroSchemaSummary";
import { usePreferenceNavigation } from "../../hooks/preferences/usePreferenceNavigation";
import { useFeedbackStore } from "../../stores/ui/feedbackStore";
import { useManualAvroSchemaStore } from "../../stores/ui/manualAvroSchemaStore";
import { useServerFormStore } from "../../stores/ui/serverFormStore";
import { useSidebarInteractionStore } from "../../stores/ui/sidebarInteractionStore";
import { ConnectionErrorDialog } from "../modals/ConnectionErrorDialog";
import { ManualAvroSchemaDialog } from "../modals/ManualAvroSchemaDialog";
import { PreferencesDialog } from "../modals/PreferencesDialog";
import { ServerProfileDialog } from "../modals/ServerProfileDialog";
import { TopicActionDialog } from "../modals/TopicActionDialog";

export function WorkspaceDialogs(props: {
  loading: boolean;
  onSaveServer: () => void;
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
          exportFormatTemplate={props.exportFormatTemplate}
          manualAvroSchemaRows={props.manualAvroSchemaRows}
          onActivePage={setActivePreferencesPage}
          onToggleGroup={togglePreferenceGroup}
          onQuery={setPreferencesQuery}
          onFontFamily={props.onFontFamily}
          onFontSize={props.onFontSize}
          onExportFormatTemplate={props.onExportFormatTemplate}
          onOpenManualAvroSchema={(serverId, topic) => {
            setIsPreferencesOpen(false);
            props.onOpenManualAvroSchema(serverId, topic);
          }}
          onDeleteManualAvroSchema={props.onDeleteManualAvroSchemaFor}
          onClose={() => setIsPreferencesOpen(false)}
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
