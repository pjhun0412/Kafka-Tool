import { useEffect } from "react";
import type { KafkaApi, ServerProfile } from "../../../shared/types";

type ServerBootstrapParams = {
  kafkaApi: KafkaApi | undefined;
  setStatus: (status: string) => void;
  setServers: (servers: ServerProfile[]) => void;
  setSelectedServerId: (serverId: string) => void;
};

export function useServerBootstrap({
  kafkaApi,
  setStatus,
  setServers,
  setSelectedServerId
}: ServerBootstrapParams) {
  useEffect(() => {
    if (!kafkaApi) {
      setStatus("Electron preload API is not available. Restart npm run dev.");
      return;
    }
    void kafkaApi.listServers().then((items) => {
      setServers(items);
      if (items[0]) {
        setSelectedServerId(items[0].id);
      }
    }).catch((error) => setStatus(error instanceof Error ? error.message : String(error)));
  }, [kafkaApi, setSelectedServerId, setServers, setStatus]);
}
