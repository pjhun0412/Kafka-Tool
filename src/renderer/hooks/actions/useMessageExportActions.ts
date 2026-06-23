import type { Dispatch, SetStateAction } from "react";
import type { ConsumedMessage, KafkaApi, MessageExportFormat, MessageExportPayloadOptions } from "../../../shared/types";
import type { PaneToastState, ToastState, TopicConsumeState, WorkspacePaneId } from "../../uiTypes";

type MessageExportActionParams = {
  kafkaApi: KafkaApi | undefined;
  selectedTopic: string;
  exportFormatTemplate: string;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  runPaneTask: <T>(pane: WorkspacePaneId, label: string, task: () => Promise<T>, scope?: { serverId?: string; topic?: string }) => Promise<T>;
  showPaneToast: (pane: WorkspacePaneId, message: string, kind?: "success" | "error", scope?: { serverId?: string; topic?: string }) => void;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStatus: (status: string) => void;
  setToast: Dispatch<SetStateAction<ToastState>>;
  setPaneToast: Dispatch<SetStateAction<PaneToastState>>;
};

export function useMessageExportActions({
  kafkaApi,
  selectedTopic,
  exportFormatTemplate,
  runTask,
  runPaneTask,
  showPaneToast,
  setLoading,
  setStatus,
  setToast,
  setPaneToast
}: MessageExportActionParams) {
  async function exportConsumedMessages(
    format: MessageExportFormat,
    messages: ConsumedMessage[],
    topicName = selectedTopic,
    pane?: WorkspacePaneId,
    serverId?: string,
    payloadOptions?: MessageExportPayloadOptions
  ) {
    if (!kafkaApi || !topicName) return;
    if (messages.length === 0) {
      const message = "No messages to export.";
      if (pane) {
        showPaneToast(pane, message, "error", { serverId, topic: topicName });
      } else {
        setToast({ message, kind: "error" });
      }
      return;
    }

    const exportTask = () => kafkaApi.exportMessages({
      topic: topicName,
      format,
      messages,
      template: exportFormatTemplate,
      payloadOptions
    });
    const filePath = pane
      ? await runPaneTask(pane, "Exporting messages...", exportTask, { serverId, topic: topicName })
      : await runTask("Exporting messages...", exportTask);

    if (filePath) {
      setStatus(`Messages exported: ${filePath}`);
      if (pane) {
        setPaneToast({ pane, message: "Messages exported.", kind: "success", serverId, topic: topicName });
      } else {
        setToast({ message: "Messages exported.", kind: "success" });
      }
    } else if (pane) {
      setPaneToast(null);
    } else {
      setToast(null);
    }
  }

  async function exportOffsetConditionMessages(
    format: MessageExportFormat,
    serverId: string,
    topic: string,
    state: TopicConsumeState,
    pane?: WorkspacePaneId
  ) {
    if (!kafkaApi || !serverId || !topic) return;
    if (state.mode !== "offset" || state.limit <= 0) {
      const message = "Full export is only available for offset queries.";
      if (pane) {
        showPaneToast(pane, message, "error", { serverId, topic });
      } else {
        setToast({ message, kind: "error" });
      }
      return;
    }

    const partition = state.partition === "" ? 0 : Number(state.partition);
    const exportTask = () => kafkaApi.exportOffsetMessages({
      serverId,
      topic,
      partition,
      offset: state.offset,
      limit: state.limit,
      order: state.offsetOrder,
      endOffsetExclusive: state.offsetPagination?.endOffsetExclusive,
      format,
      template: exportFormatTemplate,
      payloadOptions: {
        keyFormat: state.keyFormat,
        valueFormat: state.valueFormat,
        payloadEncoding: state.payloadEncoding,
        valueColumnPaths: state.valueColumnPaths
      }
    });

    if (pane) {
      const filePath = await runPaneTask(pane, "Exporting full offset range...", exportTask, { serverId, topic });
      if (filePath) {
        setStatus(`Full offset range exported: ${filePath}`);
        setPaneToast({ pane, message: "Full offset range exported.", kind: "success", serverId, topic });
      } else {
        setPaneToast(null);
      }
      return;
    }

    setLoading(true);
    setToast({ message: "Exporting full offset range...", kind: "loading" });
    try {
      const filePath = await exportTask();
      if (filePath) {
        setStatus(`Full offset range exported: ${filePath}`);
        setToast({ message: "Full offset range exported.", kind: "success" });
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

  return {
    exportConsumedMessages,
    exportOffsetConditionMessages
  };
}
