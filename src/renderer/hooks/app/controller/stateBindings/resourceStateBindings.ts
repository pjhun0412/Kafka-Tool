import type { AppStateComposition } from "./stateBindingTypes";

export function createResourceStateBindings(appState: AppStateComposition) {
  const resourceState = appState.resources;
  const {
    viewByServer,
    setViewByServer,
    topicViewByServer,
    setTopicViewByServer,
    selectedTopicByServer,
    setSelectedTopicByServer,
    openedTopicTabsByServer,
    setOpenedTopicTabsByServer,
    previewTopicByServer,
    setPreviewTopicByServer
  } = resourceState.navigation;
  const {
    topicsByServer,
    setTopicsByServer,
    topicGridSortingByServer,
    setTopicGridSortingByServer,
    favoriteTopicsByServer,
    setFavoriteTopicsByServer,
    topicDetailByServer,
    setTopicDetailByServer,
    topicDetailCacheByServer,
    setTopicDetailCacheByServer
  } = resourceState.topics;
  const { brokersByServer, setBrokersByServer } = resourceState.brokers;
  const {
    groupsByServer,
    setGroupsByServer,
    selectedGroupByServer,
    setSelectedGroupByServer,
    groupLagByServer,
    setGroupLagByServer
  } = resourceState.consumerGroups;
  const {
    consumeDefaultsByServer,
    setConsumeDefaultsByServer,
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    preferencesLoaded,
    setPreferencesLoaded
  } = resourceState.preferences;
  const { streamingTopicsByServer, setStreamingTopicsByServer } = resourceState.streaming;

  return {
    brokersByServer,
    consumeDefaultsByServer,
    favoriteTopicsByServer,
    groupLagByServer,
    groupsByServer,
    manualAvroSchemasByServer,
    openedTopicTabsByServer,
    previewTopicByServer,
    preferencesLoaded,
    selectedGroupByServer,
    selectedTopicByServer,
    setBrokersByServer,
    setConsumeDefaultsByServer,
    setFavoriteTopicsByServer,
    setGroupLagByServer,
    setGroupsByServer,
    setManualAvroSchemasByServer,
    setOpenedTopicTabsByServer,
    setPreviewTopicByServer,
    setPreferencesLoaded,
    setSelectedGroupByServer,
    setSelectedTopicByServer,
    setStreamingTopicsByServer,
    setTopicDetailByServer,
    setTopicDetailCacheByServer,
    setTopicGridSortingByServer,
    setTopicsByServer,
    setTopicViewByServer,
    setViewByServer,
    streamingTopicsByServer,
    topicDetailByServer,
    topicDetailCacheByServer,
    topicGridSortingByServer,
    topicsByServer,
    topicViewByServer,
    viewByServer
  };
}
