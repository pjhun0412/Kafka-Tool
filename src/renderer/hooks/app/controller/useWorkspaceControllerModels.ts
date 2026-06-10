import { useWorkspaceModelComposition } from "../workspace/useWorkspaceModelComposition";

type ModelCompositionParams = Parameters<typeof useWorkspaceModelComposition>[0];
type PaneModels = ModelCompositionParams["paneModels"];
type PaneToastRouting = ModelCompositionParams["paneToastRouting"];
type Selectors = ModelCompositionParams["selectors"];

export type WorkspaceControllerModelsParams = {
  state: Pick<
    PaneModels,
    | "selectedServerId"
    | "servers"
    | "topicsByServer"
    | "brokersByServer"
    | "groupsByServer"
    | "selectedGroupByServer"
    | "groupLagByServer"
    | "manualAvroSchemasByServer"
    | "consumeStatesByServer"
    | "splitConsumeStatesByServer"
    | "getDefaultConsumeState"
  > &
    Pick<PaneToastRouting, "paneToast" | "toast" | "activeWorkspacePane"> &
    Pick<Selectors, "activeConsumeTaskKeys" | "selectedTopicByServer" | "streamingTopicsByServer" | "setTopicGridSortingByServer">;
  derived: Pick<PaneModels, "view" | "openedTopicTabs" | "topicDetail" | "visibleSplitPane">;
  selectedTopic: PaneModels["selectedTopic"];
};

export function useWorkspaceControllerModels({
  state,
  derived,
  selectedTopic
}: WorkspaceControllerModelsParams) {
  return useWorkspaceModelComposition({
    paneModels: {
      selectedServerId: state.selectedServerId,
      selectedTopic,
      view: derived.view,
      openedTopicTabs: derived.openedTopicTabs,
      topicDetail: derived.topicDetail,
      visibleSplitPane: derived.visibleSplitPane,
      servers: state.servers,
      topicsByServer: state.topicsByServer,
      brokersByServer: state.brokersByServer,
      groupsByServer: state.groupsByServer,
      selectedGroupByServer: state.selectedGroupByServer,
      groupLagByServer: state.groupLagByServer,
      manualAvroSchemasByServer: state.manualAvroSchemasByServer,
      consumeStatesByServer: state.consumeStatesByServer,
      splitConsumeStatesByServer: state.splitConsumeStatesByServer,
      getDefaultConsumeState: state.getDefaultConsumeState
    },
    paneToastRouting: {
      paneToast: state.paneToast,
      toast: state.toast,
      activeWorkspacePane: state.activeWorkspacePane,
      visibleSplitPane: derived.visibleSplitPane,
      selectedServerId: state.selectedServerId,
      selectedTopic
    },
    selectors: {
      activeWorkspacePane: state.activeWorkspacePane,
      activeConsumeTaskKeys: state.activeConsumeTaskKeys,
      selectedServerId: state.selectedServerId,
      selectedTopicByServer: state.selectedTopicByServer,
      streamingTopicsByServer: state.streamingTopicsByServer,
      visibleSplitPane: derived.visibleSplitPane,
      view: derived.view,
      setTopicGridSortingByServer: state.setTopicGridSortingByServer
    }
  });
}
