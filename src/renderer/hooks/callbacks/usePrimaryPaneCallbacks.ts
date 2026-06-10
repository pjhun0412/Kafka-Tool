import { useMemo } from "react";
import type React from "react";
import type { ConsumedMessage, MessageExportFormat, MessageExportPayloadOptions } from "../../../shared/types";
import type { OffsetOrder, SplitPaneState, TopicConsumeState, View, WorkspaceActionTarget, WorkspacePaneId } from "../../uiTypes";
import type { ConsumeDefaultPatch } from "../../uiTypes";
import { createPrimaryConsumeCallbacks, createPrimaryProduceCallbacks } from "./primaryPaneCallbackGroups";

export type PrimaryPaneCallbacksParams = {
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
  openTopicCreateForm: (serverId: string) => void;
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
  exportConsumedMessages: (format: MessageExportFormat, messages: ConsumedMessage[], topic: string, pane?: WorkspacePaneId, serverId?: string, payloadOptions?: MessageExportPayloadOptions) => Promise<void>;
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
  openTopicCreateForm,
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
  return useMemo(() => {
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
    createTopic: () => openTopicCreateForm(selectedServerId),
    clearTopicMessages: () => {
      if (selectedTopic) requestTopicAction("purge", [selectedTopic]);
    },
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
    ...createPrimaryConsumeCallbacks({
      selectedServerId,
      selectedTopic,
      selectedConsumeState,
      paneId,
      updateSelectedConsumeState,
      updateConsumeDefaults,
      moveOffsetPageFor,
      startConsume,
      stopConsume,
      sendMessageToProduce,
      exportConsumedMessages,
      exportOffsetConditionMessages
    }),
    ...createPrimaryProduceCallbacks({
      selectedServerId,
      selectedTopic,
      paneId,
      updateProduceDraftFor,
      produce
    })
  };
  }, [
    clearDragPayload,
    closeClusterTab,
    closeTopicTab,
    copySelectedTopicNames,
    deleteConsumerGroupsFor,
    exportConsumedMessages,
    exportOffsetConditionMessages,
    loadConsumerGroupLag,
    moveOffsetPageFor,
    openManualAvroSchema,
    openTopicCreateForm,
    openTopicTab,
    produce,
    refreshActiveWorkspaceView,
    refreshCurrentView,
    refreshGroupsForServer,
    requestTopicAction,
    selectTopicInWorkspace,
    selectedConsumeState,
    selectedGroupId,
    selectedServerId,
    selectedTopic,
    sendMessageToProduce,
    setActiveWorkspacePane,
    setSelectedGroupByServer,
    setSidebarCollapsed,
    setView,
    showServerViewInActivePane,
    startConsume,
    startTopicDrag,
    stopConsume,
    toggleAllTopicRows,
    toggleFavoriteTopic,
    toggleTopicRow,
    updateProduceDraftFor,
    updateSelectedConsumeState,
    updateConsumeDefaults,
    visibleSplitPane
  ]);
}
