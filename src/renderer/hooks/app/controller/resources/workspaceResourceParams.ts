import type { useWorkspaceControllerStateBindings } from "../useWorkspaceControllerStateBindings";
import type { WorkspaceControllerResourcesParams } from "../useWorkspaceControllerResources";

type ControllerState = ReturnType<typeof useWorkspaceControllerStateBindings>;

type ResourceActions = Pick<
  WorkspaceControllerResourcesParams["topics"],
  "clearTopicQueryForServer" | "keepSelectedTopicRowsForServer"
> &
  Pick<WorkspaceControllerResourcesParams["brokers"], "runTask" | "runWorkspaceTask">;

export function createWorkspaceResourceParams({
  state,
  actions
}: {
  state: ControllerState;
  actions: ResourceActions;
}): WorkspaceControllerResourcesParams {
  return {
    topicDetailCache: {
      topicDetailCacheByServer: state.topicDetailCacheByServer,
      setTopicDetailByServer: state.setTopicDetailByServer,
      setTopicDetailCacheByServer: state.setTopicDetailCacheByServer
    },
    selectedServerResources: {
      selectedServerId: state.selectedServerId,
      setTopicsByServer: state.setTopicsByServer,
      setSelectedTopicByServer: state.setSelectedTopicByServer,
      setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
      setGroupsByServer: state.setGroupsByServer
    },
    brokers: {
      kafkaApi: window.kafkaApi,
      selectedServerId: state.selectedServerId,
      runTask: actions.runTask,
      runWorkspaceTask: actions.runWorkspaceTask,
      setBrokersByServer: state.setBrokersByServer
    },
    topics: {
      kafkaApi: window.kafkaApi,
      selectedServerId: state.selectedServerId,
      favoriteTopicsByServer: state.favoriteTopicsByServer,
      selectedTopicByServer: state.selectedTopicByServer,
      clearTopicQueryForServer: actions.clearTopicQueryForServer,
      keepSelectedTopicRowsForServer: actions.keepSelectedTopicRowsForServer,
      runTask: actions.runTask,
      runWorkspaceTask: actions.runWorkspaceTask,
      setTopicsByServer: state.setTopicsByServer,
      setSelectedTopicByServer: state.setSelectedTopicByServer,
      setTopicDetailByServer: state.setTopicDetailByServer,
      setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
      setConsumeStatesByServer: state.setConsumeStatesByServer,
      setSplitConsumeStatesByServer: state.setSplitConsumeStatesByServer
    }
  };
}
