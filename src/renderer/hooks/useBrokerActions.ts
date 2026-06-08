import type { Dispatch, SetStateAction } from "react";
import type { BrokerSummary, KafkaApi } from "../../shared/types";
import type { WorkspacePaneId } from "../uiTypes";

type WorkspaceActionTarget = {
  pane: WorkspacePaneId;
  serverId: string;
  topic?: string;
};

type BrokerActionsParams = {
  kafkaApi: KafkaApi | undefined;
  selectedServerId: string;
  runTask: <T>(label: string, task: () => Promise<T>, options?: { toast?: boolean }) => Promise<T>;
  runWorkspaceTask: <T>(target: WorkspaceActionTarget, label: string, task: () => Promise<T>) => Promise<T>;
  setBrokersByServer: Dispatch<SetStateAction<Record<string, BrokerSummary[]>>>;
};

export function useBrokerActions({
  kafkaApi,
  selectedServerId,
  runTask,
  runWorkspaceTask,
  setBrokersByServer
}: BrokerActionsParams) {
  async function refreshBrokers() {
    if (!selectedServerId) return;
    await refreshBrokersForServer(selectedServerId);
  }

  async function refreshBrokersForServer(serverId: string, target?: WorkspaceActionTarget) {
    if (!kafkaApi) return;
    const items = target
      ? await runWorkspaceTask(target, "브로커 조회 중", () => kafkaApi.listBrokers(serverId))
      : await runTask("브로커 조회 중", () => kafkaApi.listBrokers(serverId));
    setBrokersByServer((current) => ({ ...current, [serverId]: items }));
  }

  return {
    refreshBrokers,
    refreshBrokersForServer
  };
}
