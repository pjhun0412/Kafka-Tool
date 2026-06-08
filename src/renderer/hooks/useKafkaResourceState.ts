import { useKafkaResourceStore } from "../stores/domain/kafkaResourceStore";

export function useKafkaResourceState() {
  const viewByServer = useKafkaResourceStore((state) => state.viewByServer);
  const setViewByServer = useKafkaResourceStore((state) => state.setViewByServer);
  const topicViewByServer = useKafkaResourceStore((state) => state.topicViewByServer);
  const setTopicViewByServer = useKafkaResourceStore((state) => state.setTopicViewByServer);
  const topicsByServer = useKafkaResourceStore((state) => state.topicsByServer);
  const setTopicsByServer = useKafkaResourceStore((state) => state.setTopicsByServer);
  const topicGridSortingByServer = useKafkaResourceStore((state) => state.topicGridSortingByServer);
  const setTopicGridSortingByServer = useKafkaResourceStore((state) => state.setTopicGridSortingByServer);
  const favoriteTopicsByServer = useKafkaResourceStore((state) => state.favoriteTopicsByServer);
  const setFavoriteTopicsByServer = useKafkaResourceStore((state) => state.setFavoriteTopicsByServer);
  const consumeDefaultsByServer = useKafkaResourceStore((state) => state.consumeDefaultsByServer);
  const setConsumeDefaultsByServer = useKafkaResourceStore((state) => state.setConsumeDefaultsByServer);
  const manualAvroSchemasByServer = useKafkaResourceStore((state) => state.manualAvroSchemasByServer);
  const setManualAvroSchemasByServer = useKafkaResourceStore((state) => state.setManualAvroSchemasByServer);
  const preferencesLoaded = useKafkaResourceStore((state) => state.preferencesLoaded);
  const setPreferencesLoaded = useKafkaResourceStore((state) => state.setPreferencesLoaded);
  const selectedTopicByServer = useKafkaResourceStore((state) => state.selectedTopicByServer);
  const setSelectedTopicByServer = useKafkaResourceStore((state) => state.setSelectedTopicByServer);
  const openedTopicTabsByServer = useKafkaResourceStore((state) => state.openedTopicTabsByServer);
  const setOpenedTopicTabsByServer = useKafkaResourceStore((state) => state.setOpenedTopicTabsByServer);
  const topicDetailByServer = useKafkaResourceStore((state) => state.topicDetailByServer);
  const setTopicDetailByServer = useKafkaResourceStore((state) => state.setTopicDetailByServer);
  const topicDetailCacheByServer = useKafkaResourceStore((state) => state.topicDetailCacheByServer);
  const setTopicDetailCacheByServer = useKafkaResourceStore((state) => state.setTopicDetailCacheByServer);
  const brokersByServer = useKafkaResourceStore((state) => state.brokersByServer);
  const setBrokersByServer = useKafkaResourceStore((state) => state.setBrokersByServer);
  const groupsByServer = useKafkaResourceStore((state) => state.groupsByServer);
  const setGroupsByServer = useKafkaResourceStore((state) => state.setGroupsByServer);
  const selectedGroupByServer = useKafkaResourceStore((state) => state.selectedGroupByServer);
  const setSelectedGroupByServer = useKafkaResourceStore((state) => state.setSelectedGroupByServer);
  const groupLagByServer = useKafkaResourceStore((state) => state.groupLagByServer);
  const setGroupLagByServer = useKafkaResourceStore((state) => state.setGroupLagByServer);
  const streamingTopicsByServer = useKafkaResourceStore((state) => state.streamingTopicsByServer);
  const setStreamingTopicsByServer = useKafkaResourceStore((state) => state.setStreamingTopicsByServer);

  return {
    viewByServer,
    setViewByServer,
    topicViewByServer,
    setTopicViewByServer,
    topicsByServer,
    setTopicsByServer,
    topicGridSortingByServer,
    setTopicGridSortingByServer,
    favoriteTopicsByServer,
    setFavoriteTopicsByServer,
    consumeDefaultsByServer,
    setConsumeDefaultsByServer,
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    preferencesLoaded,
    setPreferencesLoaded,
    selectedTopicByServer,
    setSelectedTopicByServer,
    openedTopicTabsByServer,
    setOpenedTopicTabsByServer,
    topicDetailByServer,
    setTopicDetailByServer,
    topicDetailCacheByServer,
    setTopicDetailCacheByServer,
    brokersByServer,
    setBrokersByServer,
    groupsByServer,
    setGroupsByServer,
    selectedGroupByServer,
    setSelectedGroupByServer,
    groupLagByServer,
    setGroupLagByServer,
    streamingTopicsByServer,
    setStreamingTopicsByServer
  };
}
