import type { Dispatch, SetStateAction } from "react";
import type { ConsumerGroupLagDetail, ConsumerGroupSummary, KafkaApi } from "../../shared/types";
import type { SplitPaneState, WorkspacePaneId } from "../uiTypes";

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
      ? await runWorkspaceTask(target, "컨슈머 그룹 조회 중", () => kafkaApi.listConsumerGroups(serverId))
      : await runTask("컨슈머 그룹 조회 중", () => kafkaApi.listConsumerGroups(serverId));
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
      await runWorkspaceTask(target, "컨슈머 그룹 삭제 중", task);
    } else {
      await runTask("컨슈머 그룹 삭제 중", task);
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
      ? await runWorkspaceTask(target, "컨슈머 그룹 lag 조회 중", () => kafkaApi.getConsumerGroupLag(serverId, groupId))
      : await runTask("컨슈머 그룹 lag 조회 중", () => kafkaApi.getConsumerGroupLag(serverId, groupId));
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
    loadConsumerGroupLag,
    loadConsumerGroupLagFor
  };
}
