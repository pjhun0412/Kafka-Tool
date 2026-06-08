import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupSummary } from "../../shared/types";
import type { QuickSearchResult } from "../quickSearch";
import type { TopicWorkView, View, WorkspaceActionTarget } from "../uiTypes";

type QuickSearchActionsParams = {
  quickSearchResults: QuickSearchResult[];
  quickSearchIndex: number;
  selectedServerId: string;
  selectedTopic: string;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
  ensureServerConnected: (serverId: string) => Promise<boolean>;
  getWorkspaceTargetForServer: (serverId?: string, topic?: string) => WorkspaceActionTarget;
  openTopicInWorkspace: (target: WorkspaceActionTarget, topic: string, nextView?: TopicWorkView) => Promise<void>;
  openManualAvroSchema: (serverId: string, topic: string) => void;
  openPreferences: (section: "editor-font" | "export-log" | "avro-schemas") => void;
  refreshTopics: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshGroupsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  loadConsumerGroupLagFor: (serverId: string, groupId: string) => Promise<void>;
  requestTopicAction: (kind: "delete" | "purge", topicsToMutate?: string[]) => void;
  requestTopicActionFor: (serverId: string, kind: "delete" | "purge", topicsToMutate: string[]) => void;
  rememberQuickSearch: (result: QuickSearchResult) => void;
  closeQuickSearch: () => void;
  setSelectedServerId: (serverId: string) => void;
  setView: (view: View) => void;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
};

export function useQuickSearchActions({
  quickSearchResults,
  quickSearchIndex,
  selectedServerId,
  selectedTopic,
  groupsByServer,
  ensureServerConnected,
  getWorkspaceTargetForServer,
  openTopicInWorkspace,
  openManualAvroSchema,
  openPreferences,
  refreshTopics,
  refreshGroups,
  refreshGroupsForServer,
  loadConsumerGroupLagFor,
  requestTopicAction,
  requestTopicActionFor,
  rememberQuickSearch,
  closeQuickSearch,
  setSelectedServerId,
  setView,
  setViewByServer
}: QuickSearchActionsParams) {
  async function openTopicFromQuickSearch(serverId: string, topic: string, nextView: TopicWorkView = "info") {
    if (!await ensureServerConnected(serverId)) return;
    await openTopicInWorkspace(getWorkspaceTargetForServer(serverId, topic), topic, nextView);
  }

  async function openConsumerGroupFromQuickSearch(serverId: string, groupId: string) {
    if (!await ensureServerConnected(serverId)) return;
    setSelectedServerId(serverId);
    setViewByServer((current) => ({ ...current, [serverId]: "consumers" }));
    if (!groupsByServer[serverId]) {
      await refreshGroupsForServer(serverId);
    }
    await loadConsumerGroupLagFor(serverId, groupId);
  }

  async function executeQuickCommand(result: QuickSearchResult) {
    const command = result.command ?? "";
    if (command === "settings") {
      openPreferences("editor-font");
      return;
    }
    if (command === "avro-settings") {
      openPreferences("avro-schemas");
      return;
    }
    if (command === "export-settings") {
      openPreferences("export-log");
      return;
    }
    if (command === "refresh-topics") {
      await refreshTopics();
      return;
    }
    if (command === "refresh-groups") {
      await refreshGroups();
      return;
    }
    if (command === "consume-current" && selectedTopic) {
      setView("consume");
      return;
    }
    if (command === "produce-current" && selectedTopic) {
      setView("produce");
      return;
    }
    if (command === "delete-current" && selectedTopic) {
      requestTopicAction("delete", [selectedTopic]);
      return;
    }
    if (command === "purge-current" && selectedTopic) {
      requestTopicAction("purge", [selectedTopic]);
      return;
    }
    if (command.startsWith("delete-topic:") && result.topic) {
      const targetServerId = result.serverId || selectedServerId;
      if (!await ensureServerConnected(targetServerId)) return;
      requestTopicActionFor(targetServerId, "delete", [result.topic]);
      return;
    }
    if (command.startsWith("purge-topic:") && result.topic) {
      const targetServerId = result.serverId || selectedServerId;
      if (!await ensureServerConnected(targetServerId)) return;
      requestTopicActionFor(targetServerId, "purge", [result.topic]);
    }
  }

  async function executeQuickSearch(result?: QuickSearchResult) {
    const selected = result ?? quickSearchResults[quickSearchIndex];
    if (!selected) return;
    rememberQuickSearch(selected);
    closeQuickSearch();
    if (selected.kind === "command") {
      await executeQuickCommand(selected);
      return;
    }
    if (selected.kind === "server" && selected.serverId) {
      await ensureServerConnected(selected.serverId);
      return;
    }
    if ((selected.kind === "topic" || selected.kind === "tab") && selected.serverId && selected.topic) {
      await openTopicFromQuickSearch(selected.serverId, selected.topic);
      return;
    }
    if (selected.kind === "avro" && selected.serverId && selected.topic) {
      if (await ensureServerConnected(selected.serverId)) {
        openManualAvroSchema(selected.serverId, selected.topic);
      }
      return;
    }
    if (selected.kind === "consumer" && selected.serverId && selected.groupId) {
      await openConsumerGroupFromQuickSearch(selected.serverId, selected.groupId);
    }
  }

  return {
    executeQuickSearch
  };
}
