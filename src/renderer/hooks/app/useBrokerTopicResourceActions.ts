import { useBrokerActions, useTopicResourceActions } from "../actions";

type BrokerTopicResourceActionsParams = {
  brokers: Parameters<typeof useBrokerActions>[0];
  topics: Parameters<typeof useTopicResourceActions>[0];
};

export function useBrokerTopicResourceActions(params: BrokerTopicResourceActionsParams) {
  const brokerActions = useBrokerActions(params.brokers);
  const topicActions = useTopicResourceActions(params.topics);

  return {
    brokerActions,
    topicActions
  };
}
