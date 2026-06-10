import type { AppStateComposition } from "./stateBindingTypes";

export function createServerStateBindings(appState: AppStateComposition) {
  const {
    servers,
    setServers,
    connectedServerIds,
    setConnectedServerIds,
    failedServerIds,
    setFailedServerIds,
    setHealthFailuresByServer,
    openClusterIds,
    setOpenClusterIds,
    selectedServerId,
    setSelectedServerId
  } = appState.serverCluster;
  const { openNewServerForm, openEditServerForm } = appState.serverForms;
  const { openTopicCreateForm, closeTopicCreateForm } = appState.topicCreateForms;

  return {
    closeTopicCreateForm,
    connectedServerIds,
    failedServerIds,
    openClusterIds,
    openEditServerForm,
    openNewServerForm,
    openTopicCreateForm,
    selectedServerId,
    servers,
    setConnectedServerIds,
    setFailedServerIds,
    setHealthFailuresByServer,
    setOpenClusterIds,
    setSelectedServerId,
    setServers
  };
}
