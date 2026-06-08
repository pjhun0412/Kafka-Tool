import { useShallow } from "zustand/react/shallow";
import { useKafkaResourceStore } from "../../stores/domain/kafkaResourceStore";

export function useKafkaResourceState() {
  return useKafkaResourceStore(useShallow((state) => ({
    viewByServer: state.viewByServer,
    setViewByServer: state.setViewByServer,
    topicViewByServer: state.topicViewByServer,
    setTopicViewByServer: state.setTopicViewByServer,
    topicsByServer: state.topicsByServer,
    setTopicsByServer: state.setTopicsByServer,
    topicGridSortingByServer: state.topicGridSortingByServer,
    setTopicGridSortingByServer: state.setTopicGridSortingByServer,
    favoriteTopicsByServer: state.favoriteTopicsByServer,
    setFavoriteTopicsByServer: state.setFavoriteTopicsByServer,
    consumeDefaultsByServer: state.consumeDefaultsByServer,
    setConsumeDefaultsByServer: state.setConsumeDefaultsByServer,
    manualAvroSchemasByServer: state.manualAvroSchemasByServer,
    setManualAvroSchemasByServer: state.setManualAvroSchemasByServer,
    preferencesLoaded: state.preferencesLoaded,
    setPreferencesLoaded: state.setPreferencesLoaded,
    selectedTopicByServer: state.selectedTopicByServer,
    setSelectedTopicByServer: state.setSelectedTopicByServer,
    openedTopicTabsByServer: state.openedTopicTabsByServer,
    setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
    topicDetailByServer: state.topicDetailByServer,
    setTopicDetailByServer: state.setTopicDetailByServer,
    topicDetailCacheByServer: state.topicDetailCacheByServer,
    setTopicDetailCacheByServer: state.setTopicDetailCacheByServer,
    brokersByServer: state.brokersByServer,
    setBrokersByServer: state.setBrokersByServer,
    groupsByServer: state.groupsByServer,
    setGroupsByServer: state.setGroupsByServer,
    selectedGroupByServer: state.selectedGroupByServer,
    setSelectedGroupByServer: state.setSelectedGroupByServer,
    groupLagByServer: state.groupLagByServer,
    setGroupLagByServer: state.setGroupLagByServer,
    streamingTopicsByServer: state.streamingTopicsByServer,
    setStreamingTopicsByServer: state.setStreamingTopicsByServer
  })));
}
