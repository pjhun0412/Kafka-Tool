import type { ConsumedMessage, MessageExportFormat } from "../../../shared/types";
import { normalizeValueColumnPaths } from "../../consumeValuePaths";
import type { OffsetOrder, TopicConsumeState, WorkspaceActionTarget, WorkspacePaneId } from "../../uiTypes";
import type { ProduceDraftOverride } from "../actions/useProduceActions";
import type { ReplayDraft, ReplayPayloadOptions } from "../../replayTypes";
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
  | "produceFor"
  | "openTopicInWorkspace"
  | "exportConsumedMessages"
  | "exportOffsetConditionMessages"
  | "activateSplitTopic"
>;

type SplitProduceCallbackParams = Pick<
  SplitPaneCallbacksParams,
  "pane" | "updateProduceDraftFor" | "produceFor"
>;

export function createSplitConsumeCallbacks(params: SplitConsumeCallbackParams) {
  const payloadOptions = {
    keyFormat: params.consumeState.keyFormat,
    valueFormat: params.consumeState.valueFormat,
    payloadEncoding: params.consumeState.payloadEncoding,
    valueColumnPaths: normalizeValueColumnPaths(params.consumeState.valueColumnPaths)
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
    sendToProduce: (message: ConsumedMessage, targetTopic?: string, targetServerId?: string, payload?: ReplayPayloadOptions) => {
      if (!params.pane) return;
      const serverId = targetServerId || params.pane.serverId;
      const topic = targetTopic || params.pane.topic;
      if (serverId !== params.pane.serverId) {
        params.sendMessageToProduce(serverId, topic, message, "primary", { navigate: false, payload });
        const target: WorkspaceActionTarget = { pane: "primary", serverId, topic };
        void params.openTopicInWorkspace(target, topic, "produce");
      } else if (topic !== params.pane.topic) {
        params.sendMessageToProduce(serverId, topic, message, "split", { navigate: false, payload });
        void params.activateSplitTopic(topic, "produce");
      } else {
        params.sendMessageToProduce(serverId, topic, message, "split", { payload });
      }
    },
    replayMessage: (serverId: string, topic: string, draft: ReplayDraft) => {
      return params.produceFor(serverId, topic, "split", draft);
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
    },
    produceDraft: (draft: ProduceDraftOverride) => {
      if (!params.pane) return Promise.resolve();
      return params.produceFor(params.pane.serverId, params.pane.topic, "split", draft);
    }
  };
}
