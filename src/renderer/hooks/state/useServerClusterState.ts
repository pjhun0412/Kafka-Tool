import { useShallow } from "zustand/react/shallow";
import { useServerClusterStore } from "../../stores/domain/serverClusterStore";

export function useServerClusterState() {
  return useServerClusterStore(useShallow((state) => ({
    servers: state.servers,
    setServers: state.setServers,
    connectedServerIds: state.connectedServerIds,
    setConnectedServerIds: state.setConnectedServerIds,
    failedServerIds: state.failedServerIds,
    setFailedServerIds: state.setFailedServerIds,
    healthFailuresByServer: state.healthFailuresByServer,
    setHealthFailuresByServer: state.setHealthFailuresByServer,
    openClusterIds: state.openClusterIds,
    setOpenClusterIds: state.setOpenClusterIds,
    selectedServerId: state.selectedServerId,
    setSelectedServerId: state.setSelectedServerId
  })));
}
