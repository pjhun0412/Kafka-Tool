import { useConsumerGroupActions } from "../../actions";

export type ConsumerGroupAppActionsParams = Parameters<typeof useConsumerGroupActions>[0];

export function useConsumerGroupAppActions(params: ConsumerGroupAppActionsParams) {
  return useConsumerGroupActions(params);
}
