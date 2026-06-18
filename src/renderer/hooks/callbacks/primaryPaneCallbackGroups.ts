import type { ConsumedMessage, MessageExportFormat } from "../../../shared/types";
import { toConsumeDefaultPatch } from "../../consumeConfig";
import type { ProduceDraftOverride } from "../actions/useProduceActions";
import type { ConsumeDefaultPatch, OffsetOrder, TopicConsumeState, WorkspacePaneId } from "../../uiTypes";
import type { PrimaryPaneCallbacksParams } from "./usePrimaryPaneCallbacks";

type PrimaryConsumeCallbackParams = Pick<
  PrimaryPaneCallbacksParams,
  | "selectedServerId"
  | "selectedTopic"
  | "selectedConsumeState"
  | "updateSelectedConsumeState"
  | "updateConsumeDefaults"
  | "moveOffsetPageFor"
  | "startConsume"
  | "stopConsume"
  | "sendMessageToProduce"
  | "exportConsumedMessages"
  | "exportOffsetConditionMessages"
> & {
  paneId?: WorkspacePaneId;
};

type PrimaryProduceCallbackParams = Pick<
  PrimaryPaneCallbacksParams,
  "selectedServerId" | "selectedTopic" | "updateProduceDraftFor" | "produce"
> & {
  paneId?: WorkspacePaneId;
};

export function createPrimaryConsumeCallbacks(params: PrimaryConsumeCallbackParams) {
  const payloadOptions = {
    keyFormat: params.selectedConsumeState.keyFormat,
    valueFormat: params.selectedConsumeState.valueFormat,
    payloadEncoding: params.selectedConsumeState.payloadEncoding
  };
  return {
    updateConsume: (patch: Partial<TopicConsumeState>) => {
      params.updateSelectedConsumeState(patch);
      params.updateConsumeDefaults(toConsumeDefaultPatch(patch) as ConsumeDefaultPatch);
    },
    offsetOrder: (offsetOrder: OffsetOrder) => {
      params.updateSelectedConsumeState({ offsetOrder, offsetPagination: null });
      params.updateConsumeDefaults({ offsetOrder });
    },
    offsetPage: (direction: "prev" | "next") => {
      void params.moveOffsetPageFor(params.selectedServerId, params.selectedTopic, params.selectedConsumeState, direction, "primary");
    },
    startConsume: () => void params.startConsume(),
    stopConsume: () => void params.stopConsume(params.selectedServerId, params.selectedTopic, "primary"),
    sendToProduce: (message: ConsumedMessage) => {
      params.sendMessageToProduce(params.selectedServerId, params.selectedTopic, message, "primary");
    },
    exportMessages: (format: MessageExportFormat, messages: ConsumedMessage[]) => {
      void params.exportConsumedMessages(format, messages, params.selectedTopic, params.paneId, params.selectedServerId, payloadOptions);
    },
    exportAll: (format: MessageExportFormat) => {
      void params.exportOffsetConditionMessages(format, params.selectedServerId, params.selectedTopic, params.selectedConsumeState, params.paneId);
    },
    messagePaneHeight: (messagePaneHeight: number) => params.updateSelectedConsumeState({ messagePaneHeight })
  };
}

export function createPrimaryProduceCallbacks(params: PrimaryProduceCallbackParams) {
  return {
    produceKey: (key: string) => params.updateProduceDraftFor(params.selectedServerId, params.selectedTopic, { key }),
    produceHeaders: (headers: string) => params.updateProduceDraftFor(params.selectedServerId, params.selectedTopic, { headers }),
    produceValue: (value: string) => params.updateProduceDraftFor(params.selectedServerId, params.selectedTopic, { value }),
    produce: () => void params.produce(params.paneId),
    produceDraft: (draft: ProduceDraftOverride) => params.produce(params.paneId, draft)
  };
}
