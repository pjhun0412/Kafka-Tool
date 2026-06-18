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
    consumeDefaults,
    setConsumeDefaults,
    viewerPreferences,
    setViewerPreferences,
    consumeDefaultsByServer,
    setConsumeDefaultsByServer,
    manualAvroSchemasByServer,
    setManualAvroSchemasByServer,
    produceTemplatesByServer,
    setProduceTemplatesByServer,
    preferencesLoaded,
    setPreferencesLoaded
  } = resourceState.preferences;
  const { streamingTopicsByServer, setStreamingTopicsByServer } = resourceState.streaming;

  return {
    brokersByServer,
    consumeDefaults,
    viewerPreferences,
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
    setConsumeDefaults,
    setViewerPreferences,
    setConsumeDefaultsByServer,
    setFavoriteTopicsByServer,
    setGroupLagByServer,
    setGroupsByServer,
    setManualAvroSchemasByServer,
    setProduceTemplatesByServer,
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
    produceTemplatesByServer,
    topicsByServer,
    topicViewByServer,
    viewByServer
  };
}
