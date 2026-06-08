import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { BrokerSummary, ConsumerGroupSummary, TopicSummary } from "../../shared/types";

type SelectedServerResourcesParams = {
  selectedServerId: string;
  connectedServerIds: string[];
  topicsByServer: Record<string, TopicSummary[]>;
  brokersByServer: Record<string, BrokerSummary[]>;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
  refreshTopics: () => Promise<void>;
  refreshBrokers: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  setTopics: (topics: TopicSummary[]) => void;
  setGroups: (groups: ConsumerGroupSummary[]) => void;
  setSelectedTopic: (topic: string) => void;
  setTopicDetail: (detail: null) => void;
  setBrokersByServer: Dispatch<SetStateAction<Record<string, BrokerSummary[]>>>;
};

export function useSelectedServerResources({
  selectedServerId,
  connectedServerIds,
  topicsByServer,
  brokersByServer,
  groupsByServer,
  refreshTopics,
  refreshBrokers,
  refreshGroups,
  setTopics,
  setGroups,
  setSelectedTopic,
  setTopicDetail,
  setBrokersByServer
}: SelectedServerResourcesParams) {
  useEffect(() => {
    if (!selectedServerId) return;
    if (connectedServerIds.includes(selectedServerId)) {
      if (!topicsByServer[selectedServerId]) {
        void refreshTopics();
      }
      if (!brokersByServer[selectedServerId]) {
        void refreshBrokers();
      }
      if (!groupsByServer[selectedServerId]) {
        void refreshGroups();
      }
      return;
    }
    setTopics([]);
    setBrokersByServer((current) => ({ ...current, [selectedServerId]: [] }));
    setGroups([]);
    setSelectedTopic("");
    setTopicDetail(null);
  }, [selectedServerId]);
}
