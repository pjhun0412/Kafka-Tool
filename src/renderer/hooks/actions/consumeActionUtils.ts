import type { ConsumedMessage } from "../../../shared/types";
import type { OffsetOrder, TopicConsumeState, WorkspacePaneId } from "../../uiTypes";
import { getStreamingTopicKey, readStreamingTopicKey } from "../../workspaceState";

export type StreamingTopicsByServer = Record<string, string[]>;

export function getRequiredPartition(state: Pick<TopicConsumeState, "partition">) {
  return state.partition === "" ? 0 : Number(state.partition);
}

export function getOptionalPartition(state: Pick<TopicConsumeState, "partition">) {
  return state.partition === "" ? undefined : Number(state.partition);
}

export function orderConsumedMessages<T extends ConsumedMessage>(items: T[], order: OffsetOrder) {
  return order === "desc" ? [...items].reverse() : items;
}

export function addStreamingTopic(
  current: StreamingTopicsByServer,
  serverId: string,
  topic: string,
  pane: WorkspacePaneId
) {
  const topicKey = getStreamingTopicKey(pane, topic);
  const topics = current[serverId] ?? [];
  return {
    ...current,
    [serverId]: topics.includes(topicKey) ? topics : [...topics, topicKey]
  };
}

export function removeStreamingTopic(
  current: StreamingTopicsByServer,
  serverId: string,
  topic: string,
  pane: WorkspacePaneId | undefined,
  onRemoved: (removedTopic: string, removedPane: WorkspacePaneId) => void
) {
  const nextTopics = (current[serverId] ?? []).filter((item) => {
    const parsed = readStreamingTopicKey(item);
    if (parsed.topic !== topic) return true;
    const shouldKeep = pane ? parsed.pane !== pane : false;
    if (!shouldKeep) {
      onRemoved(parsed.topic, parsed.pane);
    }
    return shouldKeep;
  });
  return {
    ...current,
    [serverId]: nextTopics
  };
}
