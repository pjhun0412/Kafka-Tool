import type { Dispatch, SetStateAction } from "react";
import type { ConsumedMessage, KafkaApi, MessageExportFormat } from "../../shared/types";
import type { PaneToastState, ToastState, TopicConsumeState, WorkspacePaneId } from "../uiTypes";

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
    serverId?: string
  ) {
    if (!kafkaApi || !topicName) return;
    if (pane) {
      if (messages.length === 0) {
        showPaneToast(pane, "내보낼 메시지가 없습니다.", "error", { serverId, topic: topicName });
        return;
      }
      const filePath = await runPaneTask(
        pane,
        "메시지 내보내기 중",
        () => kafkaApi.exportMessages({
          topic: topicName,
          format,
          messages,
          template: exportFormatTemplate
        }),
        { serverId, topic: topicName }
      );
      if (filePath) {
        setStatus(`메시지 내보내기 완료: ${filePath}`);
        setPaneToast({ pane, message: "메시지 내보내기 완료", kind: "success", serverId, topic: topicName });
      } else {
        setPaneToast(null);
      }
      return;
    }

    if (messages.length === 0) {
      setToast({ message: "내보낼 메시지가 없습니다.", kind: "error" });
      return;
    }
    const filePath = await runTask("메시지 내보내기 중", () =>
      kafkaApi.exportMessages({
        topic: topicName,
        format,
        messages,
        template: exportFormatTemplate
      })
    );
    if (filePath) {
      setStatus(`메시지 내보내기 완료: ${filePath}`);
      setToast({ message: "메시지 내보내기 완료", kind: "success" });
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
      if (pane) {
        showPaneToast(pane, "Offset 조회 조건에서만 전체 다운로드할 수 있습니다.", "error", { serverId, topic });
      } else {
        setToast({ message: "Offset 조회 조건에서만 전체 다운로드할 수 있습니다.", kind: "error" });
      }
      return;
    }
    const partition = state.partition === "" ? 0 : Number(state.partition);
    if (pane) {
      const filePath = await runPaneTask(
        pane,
        "전체 조건 메시지 내보내기 중",
        () => kafkaApi.exportOffsetMessages({
          serverId,
          topic,
          partition,
          offset: state.offset,
          limit: state.limit,
          order: state.offsetOrder,
          endOffsetExclusive: state.offsetPagination?.endOffsetExclusive,
          format,
          template: exportFormatTemplate
        }),
        { serverId, topic }
      );
      if (filePath) {
        setStatus(`전체 조건 메시지 내보내기 완료: ${filePath}`);
        setPaneToast({ pane, message: "전체 조건 메시지 내보내기 완료", kind: "success", serverId, topic });
      } else {
        setPaneToast(null);
      }
      return;
    }

    setLoading(true);
    setToast({ message: "전체 조건 메시지 내보내기 중", kind: "loading" });
    try {
      const filePath = await kafkaApi.exportOffsetMessages({
        serverId,
        topic,
        partition,
        offset: state.offset,
        limit: state.limit,
        order: state.offsetOrder,
        endOffsetExclusive: state.offsetPagination?.endOffsetExclusive,
        format,
        template: exportFormatTemplate
      });
      if (filePath) {
        setStatus(`전체 조건 메시지 내보내기 완료: ${filePath}`);
        setToast({ message: "전체 조건 메시지 내보내기 완료", kind: "success" });
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
