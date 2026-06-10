import { usePrimaryTopicTabActions } from "../../workspace";

type PrimaryTopicTabAppActionsParams = Parameters<typeof usePrimaryTopicTabActions>[0];

export function usePrimaryTopicTabAppActions(params: PrimaryTopicTabAppActionsParams) {
  return usePrimaryTopicTabActions(params);
}
