import type { Dispatch, SetStateAction } from "react";
import type { AppPreferences, KafkaApi, TopicDetail, TopicSummary } from "../../../shared/types";
import type { SplitPaneState, ToastState, TopicAction, TopicConsumeState, TopicWorkView, View } from "../../uiTypes";
import {
  getNextSelectedTopic,
  removeTopicsFromMetadata,
  removeTopicsFromServerLists,
  removeTopicsFromSplitPane,
  type ConsumeStatesByServer
} from "./topicMutationUtils";

type TopicMutationActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  selectedTopic: string;
  selectedTopicRows: string[];
  selectedTopicByServer: Record<string, string>;
  topicsByServer: Record<string, TopicSummary[]>;
  splitPane: SplitPaneState | null;
  pendingTopicAction: TopicAction;
  topicActionConfirmText: string;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  stopConsume: (serverId?: string, topic?: string, pane?: "primary" | "split") => Promise<void>;
  refreshTopicsForServer: (serverId: string) => Promise<void>;
  loadTopicDetail: (topic: string) => Promise<void>;
  selectPrimaryTopic: (topic: string) => Promise<void>;
  removeSelectedTopicRowsForServer: (serverId: string, topicNames: Iterable<string>) => void;
  setSelectedServerId: Dispatch<SetStateAction<string>>;
  setPendingTopicAction: Dispatch<SetStateAction<TopicAction>>;
  setTopicActionConfirmText: Dispatch<SetStateAction<string>>;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setFavoriteTopicsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setConsumeStatesByServer: Dispatch<SetStateAction<ConsumeStatesByServer>>;
  setSplitConsumeStatesByServer: Dispatch<SetStateAction<ConsumeStatesByServer>>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
  setTopicDetailCacheByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicDetail>>>>;
  setManualAvroSchemasByServer: Dispatch<SetStateAction<NonNullable<AppPreferences["manualAvroSchemasByServer"]>>>;
  setActiveWorkspacePane: Dispatch<SetStateAction<"primary" | "split">>;
  setSplitPane: Dispatch<SetStateAction<SplitPaneState | null>>;
  setSelectedTopicByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setTopicDetailByServer: Dispatch<SetStateAction<Record<string, TopicDetail | null>>>;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

export function useTopicMutationActions({
  kafkaApi,
  selectedServerId,
  selectedTopic,
  selectedTopicRows,
  selectedTopicByServer,
  topicsByServer,
  splitPane,
  pendingTopicAction,
  topicActionConfirmText,
  runTask,
  stopConsume,
  refreshTopicsForServer,
  loadTopicDetail,
  selectPrimaryTopic,
  removeSelectedTopicRowsForServer,
  setSelectedServerId,
  setPendingTopicAction,
  setTopicActionConfirmText,
  setOpenedTopicTabsByServer,
  setFavoriteTopicsByServer,
  setConsumeStatesByServer,
  setSplitConsumeStatesByServer,
  setTopicViewByServer,
  setTopicDetailCacheByServer,
  setManualAvroSchemasByServer,
  setActiveWorkspacePane,
  setSplitPane,
  setSelectedTopicByServer,
  setTopicDetailByServer,
  setToast
}: TopicMutationActionsParams) {
  function requestTopicAction(kind: "delete" | "purge", topicsToMutate = selectedTopicRows) {
    if (topicsToMutate.length === 0) return;
    requestTopicActionFor(selectedServerId, kind, topicsToMutate);
  }

  function requestTopicActionFor(serverId: string, kind: "delete" | "purge", topicsToMutate: string[]) {
    if (!serverId || topicsToMutate.length === 0) return;
    setSelectedServerId(serverId);
    setTopicActionConfirmText("");
    setPendingTopicAction({ serverId, kind, topics: [...topicsToMutate] });
  }

  function cleanupDeletedTopics(serverId: string, deletedTopics: string[]) {
    const deleted = new Set(deletedTopics);
    removeTopicsFromServerLists({
      serverId,
      deleted,
      removeSelectedTopicRowsForServer,
      setOpenedTopicTabsByServer,
      setFavoriteTopicsByServer,
      setConsumeStatesByServer,
      setSplitConsumeStatesByServer
    });
    removeTopicsFromMetadata({
      serverId,
      deleted,
      setTopicViewByServer,
      setTopicDetailCacheByServer,
      setManualAvroSchemasByServer
    });
    if (splitPane?.serverId === serverId && splitPane.topicTabs.every((topic) => deleted.has(topic))) {
      setActiveWorkspacePane("primary");
    }
    setSplitPane((current) => removeTopicsFromSplitPane(current, serverId, deleted));
    const selectedForServer = selectedTopicByServer[serverId] ?? "";
    if (deleted.has(selectedForServer)) {
      const nextTopic = getNextSelectedTopic(topicsByServer[serverId] ?? [], deleted);
      setSelectedTopicByServer((current) => ({ ...current, [serverId]: nextTopic }));
      if (nextTopic) {
        if (serverId === selectedServerId) {
          void selectPrimaryTopic(nextTopic);
        }
      } else {
        setTopicDetailByServer((current) => ({ ...current, [serverId]: null }));
      }
    }
  }

  async function confirmTopicAction() {
    if (!kafkaApi || !pendingTopicAction) return;
    const action = pendingTopicAction;
    if (topicActionConfirmText.trim().toUpperCase() !== action.kind.toUpperCase()) return;
    setPendingTopicAction(null);
    setTopicActionConfirmText("");
    if (action.kind === "delete") {
      for (const topic of action.topics) {
        await stopConsume(action.serverId, topic);
      }
      await runTask(`Deleting ${action.topics.length} topic(s)`, () =>
        kafkaApi.deleteTopics({ serverId: action.serverId, topics: action.topics })
      );
      cleanupDeletedTopics(action.serverId, action.topics);
      await refreshTopicsForServer(action.serverId);
      setToast({ message: `Deleted ${action.topics.length} topic(s).`, kind: "success" });
      return;
    }
    await runTask(`Purging ${action.topics.length} topic(s)`, () =>
      kafkaApi.purgeTopics({ serverId: action.serverId, topics: action.topics })
    );
    await refreshTopicsForServer(action.serverId);
    if (action.serverId === selectedServerId && selectedTopic && action.topics.includes(selectedTopic)) {
      await loadTopicDetail(selectedTopic);
    }
    setToast({ message: `Purged ${action.topics.length} topic(s).`, kind: "success" });
  }

  return {
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction
  };
}
