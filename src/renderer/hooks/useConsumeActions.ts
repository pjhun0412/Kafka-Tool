import type { Dispatch, SetStateAction } from "react";
import type { KafkaApi } from "../../shared/types";
import type { TopicConsumeState, WorkspaceActionTarget, WorkspacePaneId } from "../uiTypes";
import { getNextPageOffset, getOffsetPageLimit, OFFSET_PAGE_SIZE, OFFSET_PAGING_THRESHOLD } from "../consumeConfig";
import { workspaceMessages } from "../workspaceMessages";
import { getConsumeTaskKey, getStreamingTopicKey, readStreamingTopicKey } from "../workspaceState";

type ConsumeStatesByTopic = Record<string, TopicConsumeState>;
type StreamingTopicsByServer = Record<string, string[]>;

type ConsumeActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  selectedTopic: string;
  consumeStates: ConsumeStatesByTopic;
  selectedDefaultConsumeState: TopicConsumeState;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
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
  runTask,
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
    const partition = state.partition === "" ? 0 : Number(state.partition);
    const pageLimit = getOffsetPageLimit(state, pageIndex);
    if (pageLimit <= 0) return;
    setActiveConsumeTaskKeys((current) => current.includes(taskKey) ? current : [...current, taskKey]);
    try {
      updateConsumeStateFor(serverId, topic, { messages: [], selectedMessage: null }, pane);
      const result = await runWorkspaceTask({ pane, serverId, topic }, "메시지 조회 중", () =>
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
      const orderedItems = state.offsetOrder === "desc" ? [...items].reverse() : items;
      const snapshotEndOffsetExclusive = state.offsetOrder === "desc"
        ? endOffsetExclusive ?? result.endOffsetExclusive
        : result.endOffsetExclusive ?? endOffsetExclusive;
      const hasPaging = state.limit > OFFSET_PAGING_THRESHOLD;
      const pagination = hasPaging
        ? {
            totalLimit: state.limit,
            pageSize: OFFSET_PAGE_SIZE,
            pageIndex,
            currentOffset: pageOffset,
            prevOffsets,
            nextOffset: getNextPageOffset(state.offsetOrder, orderedItems),
            hasNext: orderedItems.length === pageLimit && (pageIndex + 1) * OFFSET_PAGE_SIZE < state.limit,
            endOffsetExclusive: snapshotEndOffsetExclusive
          }
        : null;
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
    const partition = state.partition === "" ? 0 : Number(state.partition);
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
        const items = await runWorkspaceTask({ pane, serverId, topic }, "time range consume 조회 중", () =>
          kafkaApi.consumeTimeRange({
            serverId,
            topic,
            partition: state.partition === "" ? undefined : partition,
            startTimestamp,
            endTimestamp,
            limit: state.limit
          })
        );
        const orderedItems = state.offsetOrder === "desc" ? [...items].reverse() : items;
        updateConsumeStateFor(serverId, topic, { messages: orderedItems, selectedMessage: orderedItems[0] ?? null, offsetPagination: null }, pane);
        return;
      }
      await runWorkspaceTask({ pane, serverId, topic }, "실시간 consume 시작 중", () =>
        kafkaApi.startConsume({
          serverId,
          topic,
          consumerId: pane,
          fromBeginning: false,
          partition: state.partition === "" ? undefined : Number(state.partition)
        })
      );
      setStartedConsumer(serverId, topic, pane);
      updateConsumeStateFor(serverId, topic, { offsetPagination: null }, pane);
      setStreamingTopicsByServer((current) => {
        const topicKey = getStreamingTopicKey(pane, topic);
        const topics = current[serverId] ?? [];
        return {
          ...current,
          [serverId]: topics.includes(topicKey) ? topics : [...topics, topicKey]
        };
      });
      setStatus(workspaceMessages.consumeReset);
    } finally {
      setActiveConsumeTaskKeys((current) => current.filter((key) => key !== taskKey));
    }
  }

  async function stopConsume(serverId = selectedServerId, topic = selectedTopic, pane?: WorkspacePaneId) {
    if (!kafkaApi) return;
    const consumerId = getStopConsumerId(serverId, topic, pane);
    await runTask("live consume 일시정지 중", () => kafkaApi.stopConsume({ serverId, topic, consumerId }), { toast: false });
    setStreamingTopicsByServer((current) => {
      const nextTopics = (current[serverId] ?? []).filter((item) => {
        const parsed = readStreamingTopicKey(item);
        if (parsed.topic !== topic) return true;
        const shouldKeep = pane ? parsed.pane !== pane : false;
        if (!shouldKeep) {
          clearStoppedConsumer(serverId, parsed.topic, parsed.pane);
        }
        return shouldKeep;
      });
      return {
        ...current,
        [serverId]: nextTopics
      };
    });
    clearMessageTarget(serverId, topic, consumerId);
  }

  return {
    startConsume,
    consumeOffsetPageFor,
    moveOffsetPageFor,
    startConsumeFor,
    stopConsume
  };
}
