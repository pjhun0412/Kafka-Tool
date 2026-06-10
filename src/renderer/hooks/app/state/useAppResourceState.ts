import {
  useKafkaBrokerResourceState,
  useKafkaConsumerGroupResourceState,
  useKafkaNavigationResourceState,
  useKafkaPreferenceResourceState,
  useKafkaStreamingResourceState,
  useKafkaTopicResourceState
} from "../../state";

export function useAppResourceState() {
  return {
    navigation: useKafkaNavigationResourceState(),
    topics: useKafkaTopicResourceState(),
    brokers: useKafkaBrokerResourceState(),
    consumerGroups: useKafkaConsumerGroupResourceState(),
    preferences: useKafkaPreferenceResourceState(),
    streaming: useKafkaStreamingResourceState()
  };
}
