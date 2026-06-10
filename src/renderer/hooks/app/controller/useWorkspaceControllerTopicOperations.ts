import { useTopicOperationActions } from "..";

type TopicOperationActionsParams = Parameters<typeof useTopicOperationActions>[0];

export function useWorkspaceControllerTopicOperations({
  closeTopicCreateForm,
  topicOperations
}: {
  closeTopicCreateForm: () => void;
  topicOperations: TopicOperationActionsParams;
}) {
  const {
    createTopic,
    requestTopicAction,
    requestTopicActionFor,
    confirmTopicAction
  } = useTopicOperationActions(topicOperations);

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
