import type { ConsumedMessage, MessageExportFormat } from "../../../shared/types";
import type { OffsetOrder, TopicConsumeState, WorkspacePaneId } from "../../uiTypes";
import type { SplitPaneCallbacksParams } from "./useSplitPaneCallbacks";

type SplitConsumeCallbackParams = Pick<
  SplitPaneCallbacksParams,
  | "pane"
  | "consumeState"
  | "updateConsumeStateFor"
  | "moveOffsetPageFor"
  | "startConsumeFor"
  | "stopConsume"
  | "sendMessageToProduce"
  | "exportConsumedMessages"
  | "exportOffsetConditionMessages"
>;

type SplitProduceCallbackParams = Pick<
  SplitPaneCallbacksParams,
  "pane" | "updateProduceDraftFor" | "produceFor"
>;

export function createSplitConsumeCallbacks(params: SplitConsumeCallbackParams) {
  const payloadOptions = {
    keyFormat: params.consumeState.keyFormat,
    valueFormat: params.consumeState.valueFormat,
    payloadEncoding: params.consumeState.payloadEncoding
  };
  return {
    updateConsume: (patch: Partial<TopicConsumeState>) => {
      if (params.pane) params.updateConsumeStateFor(params.pane.serverId, params.pane.topic, patch, "split");
    },
    offsetOrder: (offsetOrder: OffsetOrder) => {
      if (params.pane) params.updateConsumeStateFor(params.pane.serverId, params.pane.topic, { offsetOrder, offsetPagination: null }, "split");
    },
    offsetPage: (direction: "prev" | "next") => {
      if (params.pane) void params.moveOffsetPageFor(params.pane.serverId, params.pane.topic, params.consumeState, direction, "split");
    },
    startConsume: () => {
      if (params.pane) void params.startConsumeFor(params.pane.serverId, params.pane.topic, params.consumeState, "split");
    },
    stopConsume: () => {
      if (params.pane) void params.stopConsume(params.pane.serverId, params.pane.topic, "split");
    },
    sendToProduce: (message: ConsumedMessage) => {
      if (params.pane) params.sendMessageToProduce(params.pane.serverId, params.pane.topic, message, "split");
    },
    exportMessages: (format: MessageExportFormat, messages: ConsumedMessage[]) => {
      if (params.pane) void params.exportConsumedMessages(format, messages, params.pane.topic, "split", params.pane.serverId, payloadOptions);
    },
    exportAll: (format: MessageExportFormat) => {
      if (params.pane) void params.exportOffsetConditionMessages(format, params.pane.serverId, params.pane.topic, params.consumeState, "split");
    },
    messagePaneHeight: (messagePaneHeight: number) => {
      if (params.pane) params.updateConsumeStateFor(params.pane.serverId, params.pane.topic, { messagePaneHeight }, "split");
    }
  };
}

export function createSplitProduceCallbacks(params: SplitProduceCallbackParams) {
  return {
    produceKey: (key: string) => {
      if (params.pane) params.updateProduceDraftFor(params.pane.serverId, params.pane.topic, { key });
    },
    produceHeaders: (headers: string) => {
      if (params.pane) params.updateProduceDraftFor(params.pane.serverId, params.pane.topic, { headers });
    },
    produceValue: (value: string) => {
      if (params.pane) params.updateProduceDraftFor(params.pane.serverId, params.pane.topic, { value });
    },
    produce: () => {
      if (params.pane) void params.produceFor(params.pane.serverId, params.pane.topic, "split");
    }
  };
}
