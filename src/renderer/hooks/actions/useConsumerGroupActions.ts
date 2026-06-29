import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupLagDetail, ConsumerGroupOffsetResetRequest, ConsumerGroupSummary, KafkaApi } from "../../../shared/types";
import type { SplitPaneState, WorkspacePaneId } from "../../uiTypes";

type WorkspaceActionTarget = {
  pane: WorkspacePaneId;
  serverId: string;
  topic?: string;
};

type ConsumerGroupActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  selectedTopic: string;
  visibleSplitPane: SplitPaneState | null;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  runWorkspaceTask: <T>(target: WorkspaceActionTarget, label: string, task: () => Promise<T>) => Promise<T>;
  setGroupsByServer: Dispatch<SetStateAction<Record<string, ConsumerGroupSummary[]>>>;
  setSelectedGroupByServer: Dispatch<SetStateAction<Record<string, string>>>;
  setGroupLagByServer: Dispatch<SetStateAction<Record<string, Record<string, ConsumerGroupLagDetail>>>>;
};

export function useConsumerGroupActions({
  kafkaApi,
  selectedServerId,
  selectedTopic,
  visibleSplitPane,
  runTask,
  runWorkspaceTask,
  setGroupsByServer,
  setSelectedGroupByServer,
  setGroupLagByServer
}: ConsumerGroupActionsParams) {
  async function refreshGroups() {
    if (!kafkaApi || !selectedServerId) return;
    await refreshGroupsForServer(selectedServerId);
  }

  async function refreshGroupsForServer(serverId: string, target?: WorkspaceActionTarget) {
    if (!kafkaApi) return;
    const items = target
      ? await runWorkspaceTask(target, "Loading consumer groups...", () => kafkaApi.listConsumerGroups(serverId))
      : await runTask("Loading consumer groups...", () => kafkaApi.listConsumerGroups(serverId));
    setGroupsByServer((current) => ({ ...current, [serverId]: items }));
    setSelectedGroupByServer((current) => {
      const previous = current[serverId];
      return previous && items.some((group) => group.groupId === previous) ? current : { ...current, [serverId]: "" };
    });
  }

  async function deleteConsumerGroupsFor(serverId: string, groupIds: string[], target?: WorkspaceActionTarget) {
    if (!kafkaApi || !serverId) return;
    const uniqueGroupIds = [...new Set(groupIds.map((groupId) => groupId.trim()).filter(Boolean))];
    if (uniqueGroupIds.length === 0) return;

    const task = () => kafkaApi.deleteConsumerGroups({ serverId, groupIds: uniqueGroupIds });
    if (target) {
      await runWorkspaceTask(target, "Deleting consumer groups...", task);
    } else {
      await runTask("Deleting consumer groups...", task);
    }

    setGroupsByServer((current) => ({
      ...current,
      [serverId]: (current[serverId] ?? []).filter((group) => !uniqueGroupIds.includes(group.groupId))
    }));
    setSelectedGroupByServer((current) => (
      uniqueGroupIds.includes(current[serverId] ?? "") ? { ...current, [serverId]: "" } : current
    ));
    setGroupLagByServer((current) => {
      const nextDetails = { ...(current[serverId] ?? {}) };
      for (const groupId of uniqueGroupIds) {
        delete nextDetails[groupId];
      }
      return { ...current, [serverId]: nextDetails };
    });
    await refreshGroupsForServer(serverId, target);
  }

  async function resetConsumerGroupOffsetsFor(request: ConsumerGroupOffsetResetRequest, target?: WorkspaceActionTarget) {
    if (!kafkaApi || !request.serverId) {
      throw new Error("Kafka API or server id is not available.");
    }
    const task = () => {
      if (typeof kafkaApi.resetConsumerGroupOffsets !== "function") {
        throw new Error("Reset offsets API is not available. Please restart the app.");
      }
      return kafkaApi.resetConsumerGroupOffsets(request);
    };
    if (target) {
      await runWorkspaceTask(target, "Resetting consumer group offsets...", task);
    } else {
      await runTask("Resetting consumer group offsets...", task);
    }
    await loadConsumerGroupLagFor(request.serverId, request.groupId, target);
    await refreshGroupsForServer(request.serverId, target);
  }

  async function loadConsumerGroupLag(groupId: string) {
    if (!kafkaApi || !selectedServerId) return;
    const target = visibleSplitPane
      ? { pane: "primary", serverId: selectedServerId, topic: selectedTopic } satisfies WorkspaceActionTarget
      : undefined;
    await loadConsumerGroupLagFor(selectedServerId, groupId, target);
  }

  async function loadConsumerGroupLagFor(serverId: string, groupId: string, target?: WorkspaceActionTarget) {
    if (!kafkaApi || !serverId) return;
    setSelectedGroupByServer((current) => ({ ...current, [serverId]: groupId }));
    const detail = target
      ? await runWorkspaceTask(target, "Loading consumer group lag...", () => kafkaApi.getConsumerGroupLag(serverId, groupId))
      : await runTask("Loading consumer group lag...", () => kafkaApi.getConsumerGroupLag(serverId, groupId));
    setGroupLagByServer((current) => ({
      ...current,
      [serverId]: {
        ...(current[serverId] ?? {}),
        [groupId]: detail
      }
    }));
  }

  return {
    refreshGroups,
    refreshGroupsForServer,
    deleteConsumerGroupsFor,
    resetConsumerGroupOffsetsFor,
    loadConsumerGroupLag,
    loadConsumerGroupLagFor
  };
}
