import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupLagDetail } from "../../../shared/types";
import type { TopicConsumeState } from "../../uiTypes";

export function clearGroupSelectionForServer(
  serverId: string,
  setSelectedGroupByServer: Dispatch<SetStateAction<Record<string, string>>>,
  setGroupLagByServer: Dispatch<SetStateAction<Record<string, Record<string, ConsumerGroupLagDetail>>>>
) {
  setSelectedGroupByServer((current) => ({ ...current, [serverId]: "" }));
  setGroupLagByServer((current) => ({ ...current, [serverId]: {} }));
}

export function buildConsumeResetState(defaultState: TopicConsumeState, currentState: TopicConsumeState): TopicConsumeState {
  return {
    ...defaultState,
    mode: currentState.mode,
    offsetOrder: currentState.offsetOrder,
    partition: currentState.partition,
    limit: currentState.limit,
    autoScroll: currentState.autoScroll,
    maxMessages: currentState.maxMessages,
    messagePaneHeight: currentState.messagePaneHeight
  };
}
