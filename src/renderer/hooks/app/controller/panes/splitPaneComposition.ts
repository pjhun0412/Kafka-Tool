import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type { WorkspaceControllerPanesParams } from "../workspaceControllerPaneTypes";

export function createSplitPaneComposition(params: WorkspaceControllerPanesParams) {
  const {
    activeWorkspacePane,
    language,
    messagePaneHeight,
    visibleSplitPane
  } = params.context;
  const {
    connectedServerIds,
    favoriteTopicNames,
    groupLagByServer,
    manualAvroSchemasByServer,
    produceTemplatesByServer,
    selectedTopicRows,
    setProduceTemplatesByServer,
    sortedTopics,
    topicGridSortingByServer,
    updateTopicGridSortingForServer
  } = params.resources;
  const {
    splitModel,
    splitPaneToast,
    splitServer
  } = params.models;
  const {
    exportConsumedMessages,
    exportOffsetConditionMessages,
    isConsumeTaskActive,
    isTopicStreaming,
    moveOffsetPageFor,
    sendMessageToProduce,
    splitConsumeState,
    startConsumeFor,
    stopConsume,
    updateConsumeStateFor
  } = params.consume;
  const {
    produceFor,
    splitProduceDraft,
    updateProduceDraftFor
  } = params.produce;
  const {
    activateSplitTopic,
    clearDragPayload,
    closeSplitPane,
    closeSplitTopicTab,
    copySelectedTopicNames,
    deleteConsumerGroupsFor,
    loadConsumerGroupLagFor,
    openManualAvroSchema,
    openTopicCreateForm,
    refreshGroupsForServer,
    refreshSplitPaneView,
    requestTopicAction,
    setActiveWorkspacePane,
    setSelectedGroupByServer,
    showSplitView,
    startSplitPaneDrag,
    startTopicDrag,
    toggleAllTopicRows,
    toggleFavoriteTopic,
    toggleTopicRow
  } = params.callbacks;

  return {
    splitCallbacks: {
      pane: visibleSplitPane,
      consumeState: splitConsumeState,
      selectedGroupId: splitModel?.selectedGroupId ?? "",
      setActiveWorkspacePane,
      closeSplitPane,
      startSplitPaneDrag,
      clearDragPayload,
      showSplitView,
      activateSplitTopic,
      closeSplitTopicTab,
      startTopicDrag,
      refreshSplitPaneView,
      openManualAvroSchema,
      toggleTopicRow,
      toggleAllTopicRows,
      copySelectedTopicNames,
      openTopicCreateForm,
      requestTopicAction,
      toggleFavoriteTopic,
      loadConsumerGroupLagFor,
      deleteConsumerGroupsFor,
      setSelectedGroupByServer,
      refreshGroupsForServer,
      updateConsumeStateFor,
      moveOffsetPageFor,
      startConsumeFor,
      stopConsume,
      sendMessageToProduce,
      exportConsumedMessages,
      exportOffsetConditionMessages,
      updateProduceDraftFor,
      produceFor
    },
    splitPane: visibleSplitPane && splitServer && splitModel ? {
      pane: visibleSplitPane,
      server: splitServer,
      topics: sortedTopics,
      brokers: splitModel.brokers,
      groups: splitModel.groups,
      favoriteTopicNames,
      selectedTopics: selectedTopicRows,
      topicSorting: topicGridSortingByServer[visibleSplitPane.serverId] ?? [],
      onTopicSortingChange: (updater: Parameters<OnChangeFn<SortingState>>[0]) =>
        updateTopicGridSortingForServer(visibleSplitPane.serverId, updater),
      selectedGroupId: splitModel.selectedGroupId,
      selectedGroupLag: splitModel.selectedGroupLag,
      groupDetailsById: groupLagByServer[visibleSplitPane.serverId] ?? {},
      consumeState: splitConsumeState,
      isConnected: connectedServerIds.includes(visibleSplitPane.serverId),
      isConsuming: isTopicStreaming(visibleSplitPane.serverId, visibleSplitPane.topic, "split"),
      isQuerying: isConsumeTaskActive("split", visibleSplitPane.serverId, visibleSplitPane.topic),
      messagePaneHeight: splitConsumeState.messagePaneHeight ?? messagePaneHeight,
      active: activeWorkspacePane === "split",
      manualAvroSchemas: manualAvroSchemasByServer[visibleSplitPane.serverId] ?? {},
      produceTemplates: produceTemplatesByServer[visibleSplitPane.serverId]?.[visibleSplitPane.topic] ?? [],
      produceKey: splitProduceDraft.key,
      produceHeaders: splitProduceDraft.headers,
      produceValue: splitProduceDraft.value,
      onProduceTemplates: (templates) => setProduceTemplatesByServer((current) => ({
        ...current,
        [visibleSplitPane.serverId]: {
          ...(current[visibleSplitPane.serverId] ?? {}),
          [visibleSplitPane.topic]: templates
        }
      })),
      topicActivities: Object.fromEntries(
        visibleSplitPane.topicTabs.map((topic) => [
          topic,
          { live: isTopicStreaming(visibleSplitPane.serverId, topic, "split") }
        ])
      ),
      paneToast: splitPaneToast,
      language
    } : null
  };
}
