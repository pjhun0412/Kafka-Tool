import { useConsumerGroupActions } from "../../actions";

type ConsumerGroupAppActionsParams = Parameters<typeof useConsumerGroupActions>[0];

export function useConsumerGroupAppActions(params: ConsumerGroupAppActionsParams) {
  return useConsumerGroupActions(params);
}
