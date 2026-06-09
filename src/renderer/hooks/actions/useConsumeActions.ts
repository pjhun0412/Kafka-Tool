import type { Dispatch, SetStateAction } from "react";
import type { KafkaApi } from "../../../shared/types";
import type { TopicConsumeState, WorkspaceActionTarget, WorkspacePaneId } from "../../uiTypes";
import { buildOffsetPagination, getOffsetPageLimit } from "../../consumeConfig";
import { workspaceMessages } from "../../workspaceMessages";
import { getConsumeTaskKey } from "../../workspaceState";
import {
  addStreamingTopic,
  getOptionalPartition,
  getRequiredPartition,
  orderConsumedMessages,
  removeStreamingTopic,
  type StreamingTopicsByServer
} from "./consumeActionUtils";

type ConsumeStatesByTopic = Record<string, TopicConsumeState>;

type ConsumeActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  selectedTopic: string;
  consumeStates: ConsumeStatesByTopic;
  selectedDefaultConsumeState: TopicConsumeState;
  runWorkspaceTask: <T>(target: WorkspaceActionTarget, label: string, task: () => Promise<T>) => Promise<T>;
  updateConsumeStateFor: (serverId: string, topic: string, patch: Partial<TopicConsumeState>, pane?: WorkspacePaneId) => void;
  setActiveConsumeTaskKeys: Dispatch<SetStateAction<string[]>>;
  setStreamingTopicsByServer: Dispatch<SetStateAction<StreamingTopicsByServer>>;
  setStartedConsumer: (serverId: string, topic: string, pane: WorkspacePaneId) => void;
  getStopConsumerId: (serverId: string, topic: string, pane?: WorkspacePaneId) => WorkspacePaneId | undefined;
  clearStoppedConsumer: (serverId: string, topic: string, pane: WorkspacePaneId) => void;
  clearMessageTarget: (serverId: string, topic: string, consumerId?: WorkspacePaneId) => void;
  setStatus: (status: string) => void;
};

export function useConsumeActions({
  kafkaApi,
  selectedServerId,
  selectedTopic,
  consumeStates,
  selectedDefaultConsumeState,
  runWorkspaceTask,
  updateConsumeStateFor,
  setActiveConsumeTaskKeys,
  setStreamingTopicsByServer,
  setStartedConsumer,
  getStopConsumerId,
  clearStoppedConsumer,
  clearMessageTarget,
  setStatus
}: ConsumeActionsParams) {
  async function startConsume() {
    if (!kafkaApi || !selectedServerId || !selectedTopic) return;
    const state = consumeStates[selectedTopic] ?? selectedDefaultConsumeState;
    await startConsumeFor(selectedServerId, selectedTopic, state, "primary");
  }

  async function consumeOffsetPageFor(
    serverId: string,
    topic: string,
    state: TopicConsumeState,
    pageOffset: string,
    pageIndex: number,
    prevOffsets: string[],
    endOffsetExclusive: string | undefined,
    pane: WorkspacePaneId = "primary"
  ) {
    if (!kafkaApi) return;
    const taskKey = getConsumeTaskKey(pane, serverId, topic);
    const partition = getRequiredPartition(state);
    const pageLimit = getOffsetPageLimit(state, pageIndex);
    if (pageLimit <= 0) return;
    setActiveConsumeTaskKeys((current) => current.includes(taskKey) ? current : [...current, taskKey]);
    try {
      updateConsumeStateFor(serverId, topic, { messages: [], selectedMessage: null }, pane);
      const result = await runWorkspaceTask({ pane, serverId, topic }, "Loading messages...", () =>
        kafkaApi.consumeFromOffset({
          serverId,
          topic,
          partition,
          offset: pageOffset,
          limit: pageLimit,
          order: state.offsetOrder,
          endOffsetExclusive
        })
      );
      const items = result.messages;
      const orderedItems = orderConsumedMessages(items, state.offsetOrder);
      const snapshotEndOffsetExclusive = state.offsetOrder === "desc"
        ? endOffsetExclusive ?? result.endOffsetExclusive
        : result.endOffsetExclusive ?? endOffsetExclusive;
      const pagination = buildOffsetPagination({
        state,
        pageIndex,
        pageLimit,
        pageOffset,
        prevOffsets,
        messages: orderedItems,
        endOffsetExclusive: snapshotEndOffsetExclusive
      });
      updateConsumeStateFor(serverId, topic, {
        messages: orderedItems,
        selectedMessage: orderedItems[0] ?? null,
        offsetPagination: pagination
      }, pane);
    } finally {
      setActiveConsumeTaskKeys((current) => current.filter((key) => key !== taskKey));
    }
  }

  async function moveOffsetPageFor(
    serverId: string,
    topic: string,
    state: TopicConsumeState,
    direction: "prev" | "next",
    pane: WorkspacePaneId = "primary"
  ) {
    const pagination = state.offsetPagination;
    if (!pagination) return;
    if (direction === "next") {
      if (!pagination.hasNext || !pagination.nextOffset) return;
      await consumeOffsetPageFor(
        serverId,
        topic,
        state,
        pagination.nextOffset,
        pagination.pageIndex + 1,
        [...pagination.prevOffsets, pagination.currentOffset],
        pagination.endOffsetExclusive,
        pane
      );
      return;
    }
    const previousOffset = pagination.prevOffsets[pagination.prevOffsets.length - 1];
    if (previousOffset === undefined) return;
    await consumeOffsetPageFor(
      serverId,
      topic,
      state,
      previousOffset,
      Math.max(0, pagination.pageIndex - 1),
      pagination.prevOffsets.slice(0, -1),
      pagination.endOffsetExclusive,
      pane
    );
  }

  async function startConsumeFor(serverId: string, topic: string, state: TopicConsumeState, pane: WorkspacePaneId = "primary") {
    if (!kafkaApi || !serverId || !topic) return;
    const taskKey = getConsumeTaskKey(pane, serverId, topic);
    setActiveConsumeTaskKeys((current) => current.includes(taskKey) ? current : [...current, taskKey]);
    const partition = getRequiredPartition(state);
    try {
      if (state.mode === "offset") {
        await consumeOffsetPageFor(serverId, topic, state, state.offset, 0, [], undefined, pane);
        return;
      }
      if (state.mode === "timeRange") {
        const startTimestamp = state.timeStart ? new Date(state.timeStart).getTime() : NaN;
        const endTimestamp = state.timeEnd ? new Date(state.timeEnd).getTime() : NaN;
        if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
          setStatus("Start and end datetime are required.");
          return;
        }
        const items = await runWorkspaceTask({ pane, serverId, topic }, "Loading time range messages...", () =>
          kafkaApi.consumeTimeRange({
            serverId,
            topic,
            partition: getOptionalPartition(state),
            startTimestamp,
            endTimestamp,
            limit: state.limit
          })
        );
        const orderedItems = orderConsumedMessages(items, state.offsetOrder);
        updateConsumeStateFor(serverId, topic, { messages: orderedItems, selectedMessage: orderedItems[0] ?? null, offsetPagination: null }, pane);
        return;
      }
      const result = await runWorkspaceTask({ pane, serverId, topic }, "Starting live consume...", () =>
        kafkaApi.startConsume({
          serverId,
          topic,
          consumerId: pane,
          fromBeginning: false,
          partition: getOptionalPartition(state),
          record: state.liveRecordEnabled
        })
      );
      setStartedConsumer(serverId, topic, pane);
      updateConsumeStateFor(serverId, topic, {
        offsetPagination: null,
        liveRecordPath: result.liveRecordPath ?? "",
        liveRecordCount: 0
      }, pane);
      setStreamingTopicsByServer((current) => addStreamingTopic(current, serverId, topic, pane));
      setStatus(workspaceMessages.consumeReset);
    } finally {
      setActiveConsumeTaskKeys((current) => current.filter((key) => key !== taskKey));
    }
  }

  async function stopConsume(serverId = selectedServerId, topic = selectedTopic, pane?: WorkspacePaneId) {
    if (!kafkaApi) return;
    const consumerId = getStopConsumerId(serverId, topic, pane);
    const targetPane = pane ?? consumerId ?? "primary";
    await runWorkspaceTask({ pane: targetPane, serverId, topic }, "Stopping live consume...", () =>
      kafkaApi.stopConsume({ serverId, topic, consumerId })
    );
    setStreamingTopicsByServer((current) =>
      removeStreamingTopic(current, serverId, topic, pane, (removedTopic, removedPane) => {
        clearStoppedConsumer(serverId, removedTopic, removedPane);
      })
    );
    clearMessageTarget(serverId, topic, consumerId);
  }

  return {
    startConsume,
    moveOffsetPageFor,
    startConsumeFor,
    stopConsume
  };
}
