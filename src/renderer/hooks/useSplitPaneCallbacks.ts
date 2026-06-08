import type React from "react";
import type { ConsumedMessage, MessageExportFormat } from "../../shared/types";
import type { OffsetOrder, SplitPaneState, TopicConsumeState, View, WorkspaceActionTarget, WorkspacePaneId } from "../uiTypes";

type ProduceDraftPatch = { key?: string; headers?: string; value?: string };

type SplitPaneCallbacksParams = {
  pane: SplitPaneState | null;
  consumeState: TopicConsumeState;
  selectedGroupId: string;
  setActiveWorkspacePane: (pane: WorkspacePaneId) => void;
  closeSplitPane: () => Promise<void>;
  startSplitPaneDrag: (event: React.DragEvent) => void;
  clearDragPayload: () => void;
  showSplitView: (view: View) => void;
  activateSplitTopic: (topic: string) => Promise<void>;
  closeSplitTopicTab: (topic: string) => Promise<void>;
  startTopicDrag: (event: React.DragEvent, serverId: string, topic: string, source: WorkspacePaneId) => void;
  refreshSplitPaneView: (pane: SplitPaneState, state: TopicConsumeState) => Promise<void>;
  openManualAvroSchema: (serverId: string, topic: string) => void;
  toggleTopicRow: (topic: string) => void;
  toggleAllTopicRows: (topics: string[]) => void;
  copySelectedTopicNames: (topics?: string[]) => Promise<void>;
  requestTopicAction: (kind: "delete" | "purge", topics?: string[]) => void;
  toggleFavoriteTopic: (topic: string) => void;
  loadConsumerGroupLagFor: (serverId: string, groupId: string, target?: WorkspaceActionTarget) => Promise<void>;
  deleteConsumerGroupsFor: (serverId: string, groupIds: string[], target?: WorkspaceActionTarget) => Promise<void>;
  setSelectedGroupByServer: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  refreshGroupsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  updateConsumeStateFor: (serverId: string, topic: string, patch: Partial<TopicConsumeState>, pane?: WorkspacePaneId) => void;
  moveOffsetPageFor: (serverId: string, topic: string, state: TopicConsumeState, direction: "prev" | "next", pane: WorkspacePaneId) => Promise<void>;
  startConsumeFor: (serverId: string, topic: string, state: TopicConsumeState, pane: WorkspacePaneId) => Promise<void>;
  stopConsume: (serverId?: string, topic?: string, pane?: WorkspacePaneId) => Promise<void>;
  sendMessageToProduce: (serverId: string, topic: string, message: ConsumedMessage, pane?: WorkspacePaneId) => void;
  exportConsumedMessages: (format: MessageExportFormat, messages: ConsumedMessage[], topic: string, pane?: WorkspacePaneId, serverId?: string) => Promise<void>;
  exportOffsetConditionMessages: (format: MessageExportFormat, serverId: string, topic: string, state: TopicConsumeState, pane?: WorkspacePaneId) => Promise<void>;
  updateProduceDraftFor: (serverId: string, topic: string, patch: ProduceDraftPatch) => void;
  produceFor: (serverId: string, topic: string, pane?: WorkspacePaneId) => Promise<void>;
};

export function useSplitPaneCallbacks({
  pane,
  consumeState,
  selectedGroupId,
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
}: SplitPaneCallbacksParams) {
  const target: WorkspaceActionTarget | undefined = pane
    ? { pane: "split", serverId: pane.serverId, topic: pane.topic }
    : undefined;

  return {
    close: () => void closeSplitPane(),
    activate: () => setActiveWorkspacePane("split"),
    dragStart: startSplitPaneDrag,
    dragEnd: clearDragPayload,
    view: showSplitView,
    selectTopic: (topic: string) => {
      setActiveWorkspacePane("split");
      void activateSplitTopic(topic);
    },
    openTopic: (topic: string) => {
      setActiveWorkspacePane("split");
      void activateSplitTopic(topic);
    },
    closeTopic: (topic: string) => void closeSplitTopicTab(topic),
    topicDragStart: (event: React.DragEvent, topic: string) => {
      if (pane) startTopicDrag(event, pane.serverId, topic, "split");
    },
    topicDragEnd: clearDragPayload,
    refresh: () => {
      if (pane) void refreshSplitPaneView(pane, consumeState);
    },
    openSchema: () => {
      if (pane) openManualAvroSchema(pane.serverId, pane.topic);
    },
    toggleTopicSelected: toggleTopicRow,
    toggleAllTopicsSelected: toggleAllTopicRows,
    copySelectedTopics: () => void copySelectedTopicNames(),
    purgeSelectedTopics: () => requestTopicAction("purge"),
    deleteSelectedTopics: () => requestTopicAction("delete"),
    toggleTopicFavorite: toggleFavoriteTopic,
    selectGroup: (groupId: string) => {
      if (pane) void loadConsumerGroupLagFor(pane.serverId, groupId, target);
    },
    deleteConsumerGroups: (groupIds: string[]) => {
      if (pane) void deleteConsumerGroupsFor(pane.serverId, groupIds, target);
    },
    backGroup: () => {
      if (pane) setSelectedGroupByServer((current) => ({ ...current, [pane.serverId]: "" }));
    },
    refreshGroups: () => {
      if (pane) void refreshGroupsForServer(pane.serverId, target);
    },
    refreshGroupDetail: () => {
      if (pane && selectedGroupId) void loadConsumerGroupLagFor(pane.serverId, selectedGroupId, target);
    },
    updateConsume: (patch: Partial<TopicConsumeState>) => {
      if (pane) updateConsumeStateFor(pane.serverId, pane.topic, patch, "split");
    },
    offsetOrder: (offsetOrder: OffsetOrder) => {
      if (pane) updateConsumeStateFor(pane.serverId, pane.topic, { offsetOrder, offsetPagination: null }, "split");
    },
    offsetPage: (direction: "prev" | "next") => {
      if (pane) void moveOffsetPageFor(pane.serverId, pane.topic, consumeState, direction, "split");
    },
    startConsume: () => {
      if (pane) void startConsumeFor(pane.serverId, pane.topic, consumeState, "split");
    },
    stopConsume: () => {
      if (pane) void stopConsume(pane.serverId, pane.topic, "split");
    },
    sendToProduce: (message: ConsumedMessage) => {
      if (pane) sendMessageToProduce(pane.serverId, pane.topic, message, "split");
    },
    exportMessages: (format: MessageExportFormat, messages: ConsumedMessage[]) => {
      if (pane) void exportConsumedMessages(format, messages, pane.topic, "split", pane.serverId);
    },
    exportAll: (format: MessageExportFormat) => {
      if (pane) void exportOffsetConditionMessages(format, pane.serverId, pane.topic, consumeState, "split");
    },
    messagePaneHeight: (messagePaneHeight: number) => {
      if (pane) updateConsumeStateFor(pane.serverId, pane.topic, { messagePaneHeight }, "split");
    },
    produceKey: (key: string) => {
      if (pane) updateProduceDraftFor(pane.serverId, pane.topic, { key });
    },
    produceHeaders: (headers: string) => {
      if (pane) updateProduceDraftFor(pane.serverId, pane.topic, { headers });
    },
    produceValue: (value: string) => {
      if (pane) updateProduceDraftFor(pane.serverId, pane.topic, { value });
    },
    produce: () => {
      if (pane) void produceFor(pane.serverId, pane.topic, "split");
    }
  };
}
