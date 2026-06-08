import type React from "react";
import type { ConsumedMessage, MessageExportFormat } from "../../shared/types";
import type { OffsetOrder, SplitPaneState, TopicConsumeState, View, WorkspaceActionTarget, WorkspacePaneId } from "../uiTypes";
import type { ConsumeDefaultPatch } from "../uiTypes";
import { toConsumeDefaultPatch } from "../consumeConfig";

type PrimaryPaneCallbacksParams = {
  selectedServerId: string;
  selectedTopic: string;
  selectedConsumeState: TopicConsumeState;
  selectedGroupId: string;
  visibleSplitPane: SplitPaneState | null;
  setActiveWorkspacePane: (pane: WorkspacePaneId) => void;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  closeClusterTab: (serverId: string) => Promise<void>;
  showServerViewInActivePane: (view: View) => void;
  refreshActiveWorkspaceView: () => Promise<void>;
  selectTopicInWorkspace: (target: WorkspaceActionTarget, topic: string) => Promise<void>;
  closeTopicTab: (topic: string) => Promise<void>;
  startTopicDrag: (event: React.DragEvent, serverId: string, topic: string, source: WorkspacePaneId) => void;
  clearDragPayload: () => void;
  setView: (view: View) => void;
  openManualAvroSchema: (serverId: string, topic: string) => void;
  refreshCurrentView: (pane?: WorkspacePaneId) => Promise<void>;
  openTopicTab: (topic: string) => Promise<void>;
  toggleTopicRow: (topic: string) => void;
  toggleAllTopicRows: (topics: string[]) => void;
  copySelectedTopicNames: (topics?: string[]) => Promise<void>;
  requestTopicAction: (kind: "delete" | "purge", topics?: string[]) => void;
  toggleFavoriteTopic: (topic: string) => void;
  loadConsumerGroupLag: (groupId: string) => Promise<void>;
  deleteConsumerGroupsFor: (serverId: string, groupIds: string[], target?: WorkspaceActionTarget) => Promise<void>;
  setSelectedGroupByServer: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  refreshGroupsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  updateSelectedConsumeState: (patch: Partial<TopicConsumeState>) => void;
  updateConsumeDefaults: (patch: ConsumeDefaultPatch) => void;
  moveOffsetPageFor: (serverId: string, topic: string, state: TopicConsumeState, direction: "prev" | "next", pane: WorkspacePaneId) => Promise<void>;
  startConsume: () => Promise<void>;
  stopConsume: (serverId?: string, topic?: string, pane?: WorkspacePaneId) => Promise<void>;
  sendMessageToProduce: (serverId: string, topic: string, message: ConsumedMessage, pane?: WorkspacePaneId) => void;
  exportConsumedMessages: (format: MessageExportFormat, messages: ConsumedMessage[], topic: string, pane?: WorkspacePaneId, serverId?: string) => Promise<void>;
  exportOffsetConditionMessages: (format: MessageExportFormat, serverId: string, topic: string, state: TopicConsumeState, pane?: WorkspacePaneId) => Promise<void>;
  updateProduceDraftFor: (serverId: string, topic: string, patch: { key?: string; headers?: string; value?: string }) => void;
  produce: (pane?: WorkspacePaneId) => Promise<void>;
};

export function usePrimaryPaneCallbacks({
  selectedServerId,
  selectedTopic,
  selectedConsumeState,
  selectedGroupId,
  visibleSplitPane,
  setActiveWorkspacePane,
  setSidebarCollapsed,
  closeClusterTab,
  showServerViewInActivePane,
  refreshActiveWorkspaceView,
  selectTopicInWorkspace,
  closeTopicTab,
  startTopicDrag,
  clearDragPayload,
  setView,
  openManualAvroSchema,
  refreshCurrentView,
  openTopicTab,
  toggleTopicRow,
  toggleAllTopicRows,
  copySelectedTopicNames,
  requestTopicAction,
  toggleFavoriteTopic,
  loadConsumerGroupLag,
  deleteConsumerGroupsFor,
  setSelectedGroupByServer,
  refreshGroupsForServer,
  updateSelectedConsumeState,
  updateConsumeDefaults,
  moveOffsetPageFor,
  startConsume,
  stopConsume,
  sendMessageToProduce,
  exportConsumedMessages,
  exportOffsetConditionMessages,
  updateProduceDraftFor,
  produce
}: PrimaryPaneCallbacksParams) {
  const topicTarget: WorkspaceActionTarget = { pane: "primary", serverId: selectedServerId, topic: selectedTopic };
  const paneTarget = visibleSplitPane ? topicTarget : undefined;
  const paneId = visibleSplitPane ? "primary" : undefined;

  return {
    activate: () => setActiveWorkspacePane("primary"),
    toggleSidebar: () => setSidebarCollapsed((current) => !current),
    closeCluster: (serverId: string) => void closeClusterTab(serverId),
    serverView: showServerViewInActivePane,
    refreshServerView: () => void refreshActiveWorkspaceView(),
    selectTopic: (topic: string) => {
      setActiveWorkspacePane("primary");
      void selectTopicInWorkspace({ pane: "primary", serverId: selectedServerId, topic }, topic);
    },
    closeTopic: (topic: string) => void closeTopicTab(topic),
    topicDragStart: (event: React.DragEvent, topic: string) => startTopicDrag(event, selectedServerId, topic, "primary"),
    topicDragEnd: clearDragPayload,
    topicView: setView,
    openSchema: () => openManualAvroSchema(selectedServerId, selectedTopic),
    refreshTopicView: () => void refreshCurrentView(paneId),
    openTopic: (topic: string) => void openTopicTab(topic),
    selectTopicFromTable: (topic: string) => void selectTopicInWorkspace({ pane: "primary", serverId: selectedServerId, topic }, topic),
    toggleTopicSelected: toggleTopicRow,
    toggleAllTopicsSelected: toggleAllTopicRows,
    copySelectedTopics: () => void copySelectedTopicNames(),
    purgeSelectedTopics: () => requestTopicAction("purge"),
    deleteSelectedTopics: () => requestTopicAction("delete"),
    toggleTopicFavorite: toggleFavoriteTopic,
    selectGroup: (groupId: string) => void loadConsumerGroupLag(groupId),
    deleteConsumerGroups: (groupIds: string[]) => void deleteConsumerGroupsFor(selectedServerId, groupIds, paneTarget),
    backGroup: () => setSelectedGroupByServer((current) => ({ ...current, [selectedServerId]: "" })),
    refreshGroups: () => void refreshGroupsForServer(selectedServerId, paneTarget),
    refreshGroupDetail: () => {
      if (selectedGroupId) void loadConsumerGroupLag(selectedGroupId);
    },
    updateConsume: (patch: Partial<TopicConsumeState>) => {
      updateSelectedConsumeState(patch);
      updateConsumeDefaults(toConsumeDefaultPatch(patch));
    },
    offsetOrder: (offsetOrder: OffsetOrder) => {
      updateSelectedConsumeState({ offsetOrder, offsetPagination: null });
      updateConsumeDefaults({ offsetOrder });
    },
    offsetPage: (direction: "prev" | "next") => void moveOffsetPageFor(selectedServerId, selectedTopic, selectedConsumeState, direction, "primary"),
    startConsume: () => void startConsume(),
    stopConsume: () => void stopConsume(selectedServerId, selectedTopic, "primary"),
    sendToProduce: (message: ConsumedMessage) => sendMessageToProduce(selectedServerId, selectedTopic, message, "primary"),
    exportMessages: (format: MessageExportFormat, messages: ConsumedMessage[]) => void exportConsumedMessages(format, messages, selectedTopic, paneId, selectedServerId),
    exportAll: (format: MessageExportFormat) => void exportOffsetConditionMessages(format, selectedServerId, selectedTopic, selectedConsumeState, paneId),
    messagePaneHeight: (messagePaneHeight: number) => updateSelectedConsumeState({ messagePaneHeight }),
    produceKey: (key: string) => updateProduceDraftFor(selectedServerId, selectedTopic, { key }),
    produceHeaders: (headers: string) => updateProduceDraftFor(selectedServerId, selectedTopic, { headers }),
    produceValue: (value: string) => updateProduceDraftFor(selectedServerId, selectedTopic, { value }),
    produce: () => void produce(paneId)
  };
}
