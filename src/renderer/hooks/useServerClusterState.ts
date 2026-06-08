import { useServerClusterStore } from "../stores/domain/serverClusterStore";

export function useServerClusterState() {
  const servers = useServerClusterStore((state) => state.servers);
  const setServers = useServerClusterStore((state) => state.setServers);
  const connectedServerIds = useServerClusterStore((state) => state.connectedServerIds);
  const setConnectedServerIds = useServerClusterStore((state) => state.setConnectedServerIds);
  const failedServerIds = useServerClusterStore((state) => state.failedServerIds);
  const setFailedServerIds = useServerClusterStore((state) => state.setFailedServerIds);
  const healthFailuresByServer = useServerClusterStore((state) => state.healthFailuresByServer);
  const setHealthFailuresByServer = useServerClusterStore((state) => state.setHealthFailuresByServer);
  const openClusterIds = useServerClusterStore((state) => state.openClusterIds);
  const setOpenClusterIds = useServerClusterStore((state) => state.setOpenClusterIds);
  const selectedServerId = useServerClusterStore((state) => state.selectedServerId);
  const setSelectedServerId = useServerClusterStore((state) => state.setSelectedServerId);

  return {
    servers,
    setServers,
    connectedServerIds,
    setConnectedServerIds,
    failedServerIds,
    setFailedServerIds,
    healthFailuresByServer,
    setHealthFailuresByServer,
    openClusterIds,
    setOpenClusterIds,
    selectedServerId,
    setSelectedServerId
  };
}
