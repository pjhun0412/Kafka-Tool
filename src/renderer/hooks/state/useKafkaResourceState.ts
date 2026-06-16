import { useShallow } from "zustand/react/shallow";
import { useBrokerResourceStore } from "../../stores/domain/brokerResourceStore";
import { useConsumerGroupResourceStore } from "../../stores/domain/consumerGroupResourceStore";
import { useKafkaNavigationStore } from "../../stores/domain/kafkaNavigationStore";
import { useKafkaPreferenceStore } from "../../stores/domain/kafkaPreferenceStore";
import { useKafkaStreamingStore } from "../../stores/domain/kafkaStreamingStore";
import { useTopicResourceStore } from "../../stores/domain/topicResourceStore";

export function useKafkaNavigationResourceState() {
  return useKafkaNavigationStore(useShallow((state) => ({
    viewByServer: state.viewByServer,
    setViewByServer: state.setViewByServer,
    topicViewByServer: state.topicViewByServer,
    setTopicViewByServer: state.setTopicViewByServer,
    selectedTopicByServer: state.selectedTopicByServer,
    setSelectedTopicByServer: state.setSelectedTopicByServer,
    openedTopicTabsByServer: state.openedTopicTabsByServer,
    setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
    previewTopicByServer: state.previewTopicByServer,
    setPreviewTopicByServer: state.setPreviewTopicByServer
  })));
}

export function useKafkaTopicResourceState() {
  return useTopicResourceStore(useShallow((state) => ({
    topicsByServer: state.topicsByServer,
    setTopicsByServer: state.setTopicsByServer,
    topicGridSortingByServer: state.topicGridSortingByServer,
    setTopicGridSortingByServer: state.setTopicGridSortingByServer,
    favoriteTopicsByServer: state.favoriteTopicsByServer,
    setFavoriteTopicsByServer: state.setFavoriteTopicsByServer,
    topicDetailByServer: state.topicDetailByServer,
    setTopicDetailByServer: state.setTopicDetailByServer,
    topicDetailCacheByServer: state.topicDetailCacheByServer,
    setTopicDetailCacheByServer: state.setTopicDetailCacheByServer
  })));
}

export function useKafkaBrokerResourceState() {
  return useBrokerResourceStore(useShallow((state) => ({
    brokersByServer: state.brokersByServer,
    setBrokersByServer: state.setBrokersByServer
  })));
}

export function useKafkaConsumerGroupResourceState() {
  return useConsumerGroupResourceStore(useShallow((state) => ({
    groupsByServer: state.groupsByServer,
    setGroupsByServer: state.setGroupsByServer,
    selectedGroupByServer: state.selectedGroupByServer,
    setSelectedGroupByServer: state.setSelectedGroupByServer,
    groupLagByServer: state.groupLagByServer,
    setGroupLagByServer: state.setGroupLagByServer
  })));
}

export function useKafkaPreferenceResourceState() {
  return useKafkaPreferenceStore(useShallow((state) => ({
    consumeDefaults: state.consumeDefaults,
    setConsumeDefaults: state.setConsumeDefaults,
    viewerPreferences: state.viewerPreferences,
    setViewerPreferences: state.setViewerPreferences,
    consumeDefaultsByServer: state.consumeDefaultsByServer,
    setConsumeDefaultsByServer: state.setConsumeDefaultsByServer,
    manualAvroSchemasByServer: state.manualAvroSchemasByServer,
    setManualAvroSchemasByServer: state.setManualAvroSchemasByServer,
    preferencesLoaded: state.preferencesLoaded,
    setPreferencesLoaded: state.setPreferencesLoaded
  })));
}

export function useKafkaStreamingResourceState() {
  return useKafkaStreamingStore(useShallow((state) => ({
    streamingTopicsByServer: state.streamingTopicsByServer,
    setStreamingTopicsByServer: state.setStreamingTopicsByServer
  })));
}
