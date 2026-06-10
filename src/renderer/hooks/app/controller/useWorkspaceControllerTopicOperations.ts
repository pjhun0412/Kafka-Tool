import { useTopicOperationActions } from "../actions/useTopicOperationActions";

type TopicOperationActionsParams = Parameters<typeof useTopicOperationActions>[0];

export type WorkspaceControllerTopicOperationsParams = {
  state: Pick<
    TopicOperationActionsParams,
    | "pendingTopicAction"
    | "selectedServerId"
    | "selectedTopic"
    | "selectedTopicByServer"
    | "selectedTopicRows"
    | "setActiveWorkspacePane"
    | "setConsumeStatesByServer"
    | "setFavoriteTopicsByServer"
    | "setManualAvroSchemasByServer"
    | "setOpenedTopicTabsByServer"
    | "setPendingTopicAction"
    | "setSelectedServerId"
    | "setSelectedTopicByServer"
    | "setSplitConsumeStatesByServer"
    | "setSplitPane"
    | "setToast"
    | "setTopicActionConfirmText"
    | "setTopicDetailByServer"
    | "setTopicDetailCacheByServer"
    | "setTopicViewByServer"
    | "splitPane"
    | "topicActionConfirmText"
    | "topicsByServer"
  >;
  actions: Pick<TopicOperationActionsParams, "loadTopicDetail" | "refreshTopicsForServer" | "removeSelectedTopicRowsForServer" | "runTask" | "selectPrimaryTopic" | "stopConsume">;
  closeTopicCreateForm: () => void;
};

export function useWorkspaceControllerTopicOperations({
  state,
  actions,
  closeTopicCreateForm
}: WorkspaceControllerTopicOperationsParams) {
  const {
    createTopic,
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction
  } = useTopicOperationActions({
    kafkaApi: window.kafkaApi,
    selectedServerId: state.selectedServerId,
    selectedTopic: state.selectedTopic,
    selectedTopicRows: state.selectedTopicRows,
    selectedTopicByServer: state.selectedTopicByServer,
    topicsByServer: state.topicsByServer,
    splitPane: state.splitPane,
    pendingTopicAction: state.pendingTopicAction,
    topicActionConfirmText: state.topicActionConfirmText,
    runTask: actions.runTask,
    stopConsume: actions.stopConsume,
    refreshTopicsForServer: actions.refreshTopicsForServer,
    loadTopicDetail: actions.loadTopicDetail,
    selectPrimaryTopic: actions.selectPrimaryTopic,
    removeSelectedTopicRowsForServer: actions.removeSelectedTopicRowsForServer,
    setSelectedServerId: state.setSelectedServerId,
    setPendingTopicAction: state.setPendingTopicAction,
    setTopicActionConfirmText: state.setTopicActionConfirmText,
    setOpenedTopicTabsByServer: state.setOpenedTopicTabsByServer,
    setFavoriteTopicsByServer: state.setFavoriteTopicsByServer,
    setConsumeStatesByServer: state.setConsumeStatesByServer,
    setSplitConsumeStatesByServer: state.setSplitConsumeStatesByServer,
    setTopicViewByServer: state.setTopicViewByServer,
    setTopicDetailCacheByServer: state.setTopicDetailCacheByServer,
    setManualAvroSchemasByServer: state.setManualAvroSchemasByServer,
    setActiveWorkspacePane: state.setActiveWorkspacePane,
    setSplitPane: state.setSplitPane,
    setSelectedTopicByServer: state.setSelectedTopicByServer,
    setTopicDetailByServer: state.setTopicDetailByServer,
    setToast: state.setToast
  });

  async function submitTopicCreate(form: Parameters<typeof createTopic>[0]) {
    await createTopic(form);
    closeTopicCreateForm();
  }

  return {
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction,
    submitTopicCreate
  };
}
