import { useTopicMutationActions } from "../../actions";

type TopicOperationActionsParams = Parameters<typeof useTopicMutationActions>[0];

export function useTopicOperationActions(params: TopicOperationActionsParams) {
  return useTopicMutationActions(params);
}
