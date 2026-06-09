import type { Dispatch, SetStateAction } from "react";
import type { AppPreferences, TopicDetail, TopicSummary } from "../../../shared/types";
import type { SplitPaneState, TopicConsumeState, TopicWorkView } from "../../uiTypes";
import { getNextTopicAfterTabClose, removeTopicConsumeStates } from "../../workspaceState";

export type ConsumeStatesByServer = Record<string, Record<string, TopicConsumeState>>;

export function removeTopicsFromServerLists(params: {
  serverId: string;
  deleted: Set<string>;
  removeSelectedTopicRowsForServer: (serverId: string, topicNames: Iterable<string>) => void;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setFavoriteTopicsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setConsumeStatesByServer: Dispatch<SetStateAction<ConsumeStatesByServer>>;
  setSplitConsumeStatesByServer: Dispatch<SetStateAction<ConsumeStatesByServer>>;
}) {
  params.removeSelectedTopicRowsForServer(params.serverId, params.deleted);
  params.setOpenedTopicTabsByServer((current) => ({
    ...current,
    [params.serverId]: (current[params.serverId] ?? []).filter((topic) => !params.deleted.has(topic))
  }));
  params.setFavoriteTopicsByServer((current) => ({
    ...current,
    [params.serverId]: (current[params.serverId] ?? []).filter((topic) => !params.deleted.has(topic))
  }));
  params.setConsumeStatesByServer((current) => removeTopicConsumeStates(current, params.serverId, params.deleted));
  params.setSplitConsumeStatesByServer((current) => removeTopicConsumeStates(current, params.serverId, params.deleted));
}

export function removeTopicsFromMetadata(params: {
  serverId: string;
  deleted: Set<string>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
  setTopicDetailCacheByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicDetail>>>>;
  setManualAvroSchemasByServer: Dispatch<SetStateAction<NonNullable<AppPreferences["manualAvroSchemasByServer"]>>>;
}) {
  params.setTopicViewByServer((current) => {
    const serverViews = { ...(current[params.serverId] ?? {}) };
    for (const topic of params.deleted) delete serverViews[topic];
    return { ...current, [params.serverId]: serverViews };
  });
  params.setTopicDetailCacheByServer((current) => {
    const serverDetails = { ...(current[params.serverId] ?? {}) };
    for (const topic of params.deleted) delete serverDetails[topic];
    return { ...current, [params.serverId]: serverDetails };
  });
  params.setManualAvroSchemasByServer((current) => {
    const serverSchemas = { ...(current[params.serverId] ?? {}) };
    for (const topic of params.deleted) delete serverSchemas[topic];
    return { ...current, [params.serverId]: serverSchemas };
  });
}

export function removeTopicsFromSplitPane(pane: SplitPaneState | null, serverId: string, deleted: Set<string>) {
  if (!pane || pane.serverId !== serverId) return pane;
  const nextTabs = pane.topicTabs.filter((topic) => !deleted.has(topic));
  if (nextTabs.length === 0) return null;
  const nextTopic = deleted.has(pane.topic)
    ? getNextTopicAfterTabClose(pane.topic, pane.topic, nextTabs)
    : pane.topic;
  return {
    ...pane,
    topic: nextTopic,
    topicTabs: nextTabs,
    detail: deleted.has(pane.topic) ? null : pane.detail
  };
}

export function getNextSelectedTopic(topics: TopicSummary[], deleted: Set<string>) {
  return topics.find((topic) => !deleted.has(topic.name))?.name ?? "";
}
