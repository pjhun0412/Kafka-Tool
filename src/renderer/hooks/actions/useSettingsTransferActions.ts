import type { Dispatch, SetStateAction } from "react";
import type { SortingState } from "@tanstack/react-table";
import type {
  AppPreferences,
  BrokerSummary,
  ConsumerGroupLagDetail,
  ConsumerGroupSummary,
  ImportSettingsResult,
  KafkaApi,
  ManualAvroSchema,
  ServerProfile,
  TopicDetail,
  TopicSummary
} from "../../../shared/types";
import type { ToastState, TopicConsumeState, TopicWorkView, View } from "../../uiTypes";
import { applyImportedPreferences, resetWorkspaceAfterSettingsImport } from "./settingsTransferUtils";

type SettingsTransferActionParams = {
  kafkaApi: KafkaApi | undefined;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStatus: (status: string) => void;
  setToast: Dispatch<SetStateAction<ToastState>>;
  setServers: Dispatch<SetStateAction<ServerProfile[]>>;
  setFavoriteTopicsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setConsumeDefaultsByServer: Dispatch<SetStateAction<AppPreferences["consumeDefaultsByServer"]>>;
  setManualAvroSchemasByServer: Dispatch<SetStateAction<Record<string, Record<string, ManualAvroSchema>>>>;
  setSidebarWidth: Dispatch<SetStateAction<number>>;
  setServerPanelHeight: Dispatch<SetStateAction<number>>;
  setMessagePaneHeight: Dispatch<SetStateAction<number>>;
  setFontFamily: Dispatch<SetStateAction<string>>;
  setFontSize: Dispatch<SetStateAction<number>>;
  setExportFormatTemplate: Dispatch<SetStateAction<string>>;
  setConnectedServerIds: Dispatch<SetStateAction<string[]>>;
  setFailedServerIds: Dispatch<SetStateAction<string[]>>;
  setOpenClusterIds: Dispatch<SetStateAction<string[]>>;
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setTopicsByServer: Dispatch<SetStateAction<Record<string, TopicSummary[]>>>;
  resetTopicSearchState: () => void;
  setSelectedTopicByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setTopicGridSortingByServer: Dispatch<SetStateAction<Record<string, SortingState>>>;
  setTopicDetailByServer: Dispatch<SetStateAction<Record<string, TopicDetail | null>>>;
  setTopicDetailCacheByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicDetail>>>>;
  setBrokersByServer: Dispatch<SetStateAction<Record<string, BrokerSummary[]>>>;
  setGroupsByServer: Dispatch<SetStateAction<Record<string, ConsumerGroupSummary[]>>>;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
  setSelectedGroupByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setGroupLagByServer: Dispatch<SetStateAction<Record<string, Record<string, ConsumerGroupLagDetail>>>>;
  setConsumeStatesByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicConsumeState>>>>;
  setSplitConsumeStatesByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicConsumeState>>>>;
  resetProduceDrafts: () => void;
  setStreamingTopicsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
};

export function useSettingsTransferActions({
  kafkaApi,
  setLoading,
  setStatus,
  setToast,
  setServers,
  setFavoriteTopicsByServer,
  setConsumeDefaultsByServer,
  setManualAvroSchemasByServer,
  setSidebarWidth,
  setServerPanelHeight,
  setMessagePaneHeight,
  setFontFamily,
  setFontSize,
  setExportFormatTemplate,
  setConnectedServerIds,
  setFailedServerIds,
  setOpenClusterIds,
  setSelectedServerId,
  setTopicsByServer,
  resetTopicSearchState,
  setSelectedTopicByServer,
  setOpenedTopicTabsByServer,
  setTopicGridSortingByServer,
  setTopicDetailByServer,
  setTopicDetailCacheByServer,
  setBrokersByServer,
  setGroupsByServer,
  setViewByServer,
  setTopicViewByServer,
  setSelectedGroupByServer,
  setGroupLagByServer,
  setConsumeStatesByServer,
  setSplitConsumeStatesByServer,
  resetProduceDrafts,
  setStreamingTopicsByServer
}: SettingsTransferActionParams) {
  function applyImportedSettings(result: ImportSettingsResult) {
    applyImportedPreferences(result.preferences, {
      setFavoriteTopicsByServer,
      setConsumeDefaultsByServer,
      setManualAvroSchemasByServer,
      setSidebarWidth,
      setServerPanelHeight,
      setMessagePaneHeight,
      setFontFamily,
      setFontSize,
      setExportFormatTemplate
    });
    resetWorkspaceAfterSettingsImport(result, {
      setServers,
      setConnectedServerIds,
      setFailedServerIds,
      setOpenClusterIds,
      setSelectedServerId,
      setTopicsByServer,
      resetTopicSearchState,
      setSelectedTopicByServer,
      setOpenedTopicTabsByServer,
      setTopicGridSortingByServer,
      setTopicDetailByServer,
      setTopicDetailCacheByServer,
      setBrokersByServer,
      setGroupsByServer,
      setViewByServer,
      setTopicViewByServer,
      setSelectedGroupByServer,
      setGroupLagByServer,
      setConsumeStatesByServer,
      setSplitConsumeStatesByServer,
      resetProduceDrafts,
      setStreamingTopicsByServer
    });
  }

  async function exportSettings() {
    if (!kafkaApi) return;
    setLoading(true);
    setToast({ message: "Exporting settings...", kind: "loading" });
    try {
      const filePath = await kafkaApi.exportSettings();
      if (filePath) {
        setStatus(`Settings exported: ${filePath}`);
        setToast({ message: "Settings exported.", kind: "success" });
      } else {
        setToast(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function importSettings() {
    if (!kafkaApi) return;
    if (!window.confirm("Replace the current server list and preferences with the imported file?")) {
      return;
    }
    setLoading(true);
    setToast({ message: "Importing settings...", kind: "loading" });
    try {
      const result = await kafkaApi.importSettings();
      if (!result) {
        setToast(null);
        return;
      }
      applyImportedSettings(result);
      setStatus("Settings imported.");
      setToast({ message: "Settings imported.", kind: "success" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setToast({ message, kind: "error" });
    } finally {
      setLoading(false);
    }
  }

  return {
    applyImportedSettings,
    exportSettings,
    importSettings
  };
}
