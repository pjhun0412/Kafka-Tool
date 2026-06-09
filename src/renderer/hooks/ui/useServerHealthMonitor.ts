import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { KafkaApi, ServerProfile } from "../../../shared/types";
import type { ToastState } from "../../uiTypes";

type ServerHealthMonitorParams = {
  kafkaApi: KafkaApi | undefined;
  servers: ServerProfile[];
  connectedServerIds: string[];
  failedServerIds: string[];
  openClusterIds: string[];
  setConnectedServerIds: Dispatch<SetStateAction<string[]>>;
  setFailedServerIds: Dispatch<SetStateAction<string[]>>;
  setHealthFailuresByServer: Dispatch<SetStateAction<Record<string, number>>>;
  setStatus: (status: string) => void;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

export function useServerHealthMonitor({
  kafkaApi,
  servers,
  connectedServerIds,
  failedServerIds,
  openClusterIds,
  setConnectedServerIds,
  setFailedServerIds,
  setHealthFailuresByServer,
  setStatus,
  setToast
}: ServerHealthMonitorParams) {
  useEffect(() => {
    if (!kafkaApi) return;
    const monitoredServerIds = [
      ...connectedServerIds,
      ...failedServerIds.filter((serverId) => openClusterIds.includes(serverId))
    ].filter((serverId, index, array) => array.indexOf(serverId) === index);
    if (monitoredServerIds.length === 0) return;

    let cancelled = false;

    const checkConnectedServers = async () => {
      await Promise.all(monitoredServerIds.map(async (serverId) => {
        const server = servers.find((item) => item.id === serverId);
        if (!server) return;
        try {
          await kafkaApi.checkHealth(serverId);
          if (cancelled) return;

          setHealthFailuresByServer((current) => {
            if (!current[serverId]) return current;
            const next = { ...current };
            delete next[serverId];
            return next;
          });
          setFailedServerIds((current) => {
            if (!current.includes(serverId)) return current;
            setToast({ message: `${server.name} server connection recovered.`, kind: "success" });
            setStatus(`${server.name} server connection recovered.`);
            return current.filter((id) => id !== serverId);
          });
          setConnectedServerIds((current) => (current.includes(serverId) ? current : [...current, serverId]));
        } catch (error) {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : String(error);
          setHealthFailuresByServer((current) => {
            const failures = (current[serverId] ?? 0) + 1;
            if (failures >= 2) {
              setConnectedServerIds((ids) => ids.filter((id) => id !== serverId));
              setFailedServerIds((ids) => {
                if (ids.includes(serverId)) return ids;
                setToast({ message: `${server.name} server connection lost.`, kind: "error" });
                setStatus(`${server.name} server connection lost: ${message}`);
                return [...ids, serverId];
              });
            }
            return { ...current, [serverId]: failures };
          });
        }
      }));
    };

    const timeoutId = window.setTimeout(() => {
      void checkConnectedServers();
    }, 5000);
    const intervalId = window.setInterval(() => {
      void checkConnectedServers();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [
    kafkaApi,
    connectedServerIds,
    failedServerIds,
    openClusterIds,
    servers,
    setConnectedServerIds,
    setFailedServerIds,
    setHealthFailuresByServer,
    setStatus,
    setToast
  ]);
}
