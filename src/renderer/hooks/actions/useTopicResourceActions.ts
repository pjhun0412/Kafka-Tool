import type { Dispatch, SetStateAction } from "react";
import type { KafkaApi, TopicDetail, TopicSummary } from "../../../shared/types";
import type { TopicConsumeState, WorkspacePaneId } from "../../uiTypes";

type WorkspaceActionTarget = {
  pane: WorkspacePaneId;
  serverId: string;
  topic?: string;
};

type RefreshTopicsOptions = {
  label?: string;
  detailLabel?: string;
};

type TopicResourceActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  favoriteTopicsByServer: Record<string, string[]>;
  selectedTopicByServer: Record<string, string>;
  clearTopicQueryForServer: (serverId: string) => void;
  keepSelectedTopicRowsForServer: (serverId: string, topicNames: Iterable<string>) => void;
  getCachedTopicDetail: (serverId: string, topic: string) => TopicDetail | null;
  setTopicDetailForServer: (serverId: string, detail: TopicDetail | null) => void;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  runWorkspaceTask: <T>(target: WorkspaceActionTarget, label: string, task: () => Promise<T>) => Promise<T>;
  setTopicsByServer: Dispatch<SetStateAction<Record<string, TopicSummary[]>>>;
  setSelectedTopicByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setTopicDetailByServer: Dispatch<SetStateAction<Record<string, TopicDetail | null>>>;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setConsumeStatesByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicConsumeState>>>>;
  setSplitConsumeStatesByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicConsumeState>>>>;
};

export function useTopicResourceActions({
  kafkaApi,
  selectedServerId,
  favoriteTopicsByServer,
  selectedTopicByServer,
  clearTopicQueryForServer,
  keepSelectedTopicRowsForServer,
  getCachedTopicDetail,
  setTopicDetailForServer,
  runTask,
  runWorkspaceTask,
  setTopicsByServer,
  setSelectedTopicByServer,
  setTopicDetailByServer,
  setOpenedTopicTabsByServer,
  setConsumeStatesByServer,
  setSplitConsumeStatesByServer
}: TopicResourceActionsParams) {
  async function refreshTopicsForServer(serverId: string, target?: WorkspaceActionTarget, options: RefreshTopicsOptions = {}) {
    if (!kafkaApi) return;
    clearTopicQueryForServer(serverId);
    const label = options.label ?? "Loading topics...";
    const detailLabel = options.detailLabel ?? "Loading topic details...";
    const items = target
      ? await runWorkspaceTask(target, label, () => kafkaApi.listTopics(serverId))
      : await runTask(label, () => kafkaApi.listTopics(serverId));
    setTopicsByServer((current) => ({ ...current, [serverId]: items }));
    void refreshTopicMessageCountsForServer(serverId, items.map((topic) => topic.name));
    const topicNames = new Set(items.map((topic) => topic.name));
    keepSelectedTopicRowsForServer(serverId, topicNames);
    const previousSelectedTopic = selectedTopicByServer[serverId] ?? "";
    const favoriteTopic = (favoriteTopicsByServer[serverId] ?? []).find((topicName) => topicNames.has(topicName));
    const nextTopic = previousSelectedTopic && items.some((topic) => topic.name === previousSelectedTopic)
      ? previousSelectedTopic
      : favoriteTopic ?? items[0]?.name ?? "";
    setSelectedTopicByServer((current) => ({ ...current, [serverId]: nextTopic }));
    if (nextTopic) {
      const detail = target
        ? await runWorkspaceTask({ ...target, topic: nextTopic }, detailLabel, () => kafkaApi.getTopicDetail(serverId, nextTopic))
        : await runTask(detailLabel, () => kafkaApi.getTopicDetail(serverId, nextTopic));
      setTopicDetailForServer(serverId, detail);
    } else {
      setTopicDetailByServer((current) => ({ ...current, [serverId]: null }));
      setOpenedTopicTabsByServer((current) => ({ ...current, [serverId]: [] }));
      setConsumeStatesByServer((current) => ({ ...current, [serverId]: {} }));
      setSplitConsumeStatesByServer((current) => ({ ...current, [serverId]: {} }));
    }
  }

  async function refreshTopicMessageCountsForServer(serverId: string, topicNames: string[]) {
    if (!kafkaApi || topicNames.length === 0) return;
    try {
      const counts = await kafkaApi.listTopicMessageCounts(serverId, topicNames);
      setTopicsByServer((current) => {
        const serverTopics = current[serverId];
        if (!serverTopics) return current;
        return {
          ...current,
          [serverId]: serverTopics.map((topic) => ({
            ...topic,
            messageCount: counts[topic.name] ?? topic.messageCount
          }))
        };
      });
    } catch {
      // Message counts are best-effort. Metadata-only topic list should stay visible.
    }
  }

  async function refreshTopics() {
    if (!kafkaApi || !selectedServerId) return;
    await refreshTopicsForServer(selectedServerId);
  }

  async function loadTopicDetail(topic: string) {
    if (!kafkaApi || !selectedServerId || !topic) return;
    setSelectedTopicByServer((current) => ({ ...current, [selectedServerId]: topic }));
    const detail = await runTask("Loading topic details...", () => kafkaApi.getTopicDetail(selectedServerId, topic));
    setTopicDetailForServer(selectedServerId, detail);
  }

  async function loadTopicDetailSilent(topic: string, options: { force?: boolean } = {}) {
    if (!kafkaApi || !selectedServerId || !topic) return;
    setSelectedTopicByServer((current) => ({ ...current, [selectedServerId]: topic }));
    const cachedDetail = options.force ? null : getCachedTopicDetail(selectedServerId, topic);
    if (cachedDetail) {
      setTopicDetailForServer(selectedServerId, cachedDetail);
      return;
    }
    const detail = await kafkaApi.getTopicDetail(selectedServerId, topic);
    setTopicDetailForServer(selectedServerId, detail);
  }

  return {
    refreshTopicsForServer,
    refreshTopicMessageCountsForServer,
    refreshTopics,
    loadTopicDetail,
    loadTopicDetailSilent
  };
}
