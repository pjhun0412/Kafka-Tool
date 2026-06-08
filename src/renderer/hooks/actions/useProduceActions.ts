import type { Dispatch, SetStateAction } from "react";
import type { ConsumedMessage, KafkaApi } from "../../../shared/types";
import type { SplitPaneState, ToastState, WorkspacePaneId } from "../../uiTypes";
import { formatProduceValue, parseProduceHeaders, validateJsonLikeValue } from "../../utils";

type ProduceDraft = {
  key: string;
  value: string;
  headers: string;
};

type ProduceActionParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  selectedTopic: string;
  getProduceDraft: (serverId: string, topic: string) => ProduceDraft;
  updateProduceDraftFor: (serverId: string, topic: string, patch: Partial<ProduceDraft>) => void;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  runPaneTask: <T>(pane: WorkspacePaneId, label: string, task: () => Promise<T>, scope?: { serverId?: string; topic?: string }) => Promise<T>;
  showPaneToast: (pane: WorkspacePaneId, message: string, kind?: "success" | "error", scope?: { serverId?: string; topic?: string }) => void;
  setSplitPane: Dispatch<SetStateAction<SplitPaneState | null>>;
  setView: (view: "produce") => void;
  setStatus: (status: string) => void;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

export function useProduceActions({
  kafkaApi,
  selectedServerId,
  selectedTopic,
  getProduceDraft,
  updateProduceDraftFor,
  runTask,
  runPaneTask,
  showPaneToast,
  setSplitPane,
  setView,
  setStatus,
  setToast
}: ProduceActionParams) {
  async function produce(pane?: WorkspacePaneId) {
    await produceFor(selectedServerId, selectedTopic, pane);
  }

  async function produceFor(serverId: string, topic: string, pane?: WorkspacePaneId) {
    if (!kafkaApi || !serverId || !topic) return;
    const draft = getProduceDraft(serverId, topic);
    const validationError = validateJsonLikeValue(draft.value);
    if (validationError) {
      setStatus(validationError);
      if (pane) {
        showPaneToast(pane, validationError, "error", { serverId, topic });
      } else {
        setToast({ message: validationError, kind: "error" });
      }
      return;
    }
    const headers = parseProduceHeaders(draft.headers);
    if (typeof headers === "string") {
      setStatus(headers);
      if (pane) {
        showPaneToast(pane, headers, "error", { serverId, topic });
      } else {
        setToast({ message: headers, kind: "error" });
      }
      return;
    }

    const executeProduce = () =>
      kafkaApi.produce({
        serverId,
        topic,
        key: draft.key,
        value: draft.value,
        headers
      });

    const result = pane
      ? await runPaneTask(pane, "Sending message...", executeProduce, { serverId, topic })
      : await runTask("Sending message...", executeProduce);
    setStatus(`전송 완료: ${result.map((item) => `p${item.partition}@${item.offset}`).join(", ")}`);
  }

  function sendMessageToProduce(serverId: string, topic: string, message: ConsumedMessage, targetPane: WorkspacePaneId = "primary") {
    updateProduceDraftFor(serverId, topic, {
      key: message.key,
      value: message.decoded?.value === undefined ? formatProduceValue(message.value) : JSON.stringify(message.decoded.value, null, 2),
      headers: JSON.stringify(message.headers ?? {}, null, 2)
    });
    if (targetPane === "split") {
      setSplitPane((current) => current && current.serverId === serverId && current.topic === topic ? { ...current, view: "produce" } : current);
    } else {
      setView("produce");
    }
    setStatus("Message copied to Produce.");
  }

  return {
    produce,
    produceFor,
    sendMessageToProduce
  };
}
