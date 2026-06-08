import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupSummary, TopicDetail, TopicSummary } from "../../shared/types";

type UseSelectedServerResourceSettersOptions = {
  selectedServerId: string;
  setTopicsByServer: Dispatch<SetStateAction<Record<string, TopicSummary[]>>>;
  setSelectedTopicByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setOpenedTopicTabsByServer: Dispatch<SetStateAction<Record<string, string[]>>>;
  setTopicDetailForServer: (serverId: string, detail: TopicDetail | null) => void;
  setGroupsByServer: Dispatch<SetStateAction<Record<string, ConsumerGroupSummary[]>>>;
};

export function useSelectedServerResourceSetters({
  selectedServerId,
  setTopicsByServer,
  setSelectedTopicByServer,
  setOpenedTopicTabsByServer,
  setTopicDetailForServer,
  setGroupsByServer
}: UseSelectedServerResourceSettersOptions) {
  function setTopics(topics: TopicSummary[]) {
    if (!selectedServerId) return;
    setTopicsByServer((current) => ({ ...current, [selectedServerId]: topics }));
  }

  function setSelectedTopic(topic: string) {
    if (!selectedServerId) return;
    setSelectedTopicByServer((current) => ({ ...current, [selectedServerId]: topic }));
  }

  function setOpenedTopicTabs(action: string[] | ((current: string[]) => string[])) {
    if (!selectedServerId) return;
    setOpenedTopicTabsByServer((current) => {
      const previous = current[selectedServerId] ?? [];
      const next = typeof action === "function" ? action(previous) : action;
      return { ...current, [selectedServerId]: next };
    });
  }

  function setTopicDetail(detail: TopicDetail | null) {
    if (!selectedServerId) return;
    setTopicDetailForServer(selectedServerId, detail);
  }

  function setGroups(groups: ConsumerGroupSummary[]) {
    if (!selectedServerId) return;
    setGroupsByServer((current) => ({ ...current, [selectedServerId]: groups }));
  }

  return {
    setTopics,
    setSelectedTopic,
    setOpenedTopicTabs,
    setTopicDetail,
    setGroups
  };
}
