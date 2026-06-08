import type { Dispatch, SetStateAction } from "react";
import type { TopicDetail } from "../../../shared/types";

type TopicDetailCacheParams = {
  topicDetailCacheByServer: Record<string, Record<string, TopicDetail>>;
  setTopicDetailByServer: Dispatch<SetStateAction<Record<string, TopicDetail | null>>>;
  setTopicDetailCacheByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicDetail>>>>;
};

export function useTopicDetailCache({
  topicDetailCacheByServer,
  setTopicDetailByServer,
  setTopicDetailCacheByServer
}: TopicDetailCacheParams) {
  function getCachedTopicDetail(serverId: string, topic: string) {
    return topicDetailCacheByServer[serverId]?.[topic] ?? null;
  }

  function setTopicDetailForServer(serverId: string, detail: TopicDetail | null) {
    setTopicDetailByServer((current) => ({ ...current, [serverId]: detail }));
    if (detail) {
      setTopicDetailCacheByServer((current) => ({
        ...current,
        [serverId]: {
          ...(current[serverId] ?? {}),
          [detail.name]: detail
        }
      }));
    }
  }

  return {
    getCachedTopicDetail,
    setTopicDetailForServer
  };
}
