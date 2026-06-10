import { useBrokerTopicResourceActions } from "../actions/useBrokerTopicResourceActions";
import { useWorkspaceResourceComposition } from "../workspace/useWorkspaceResourceComposition";

type WorkspaceResourceCompositionParams = Parameters<typeof useWorkspaceResourceComposition>[0];
type BrokerTopicResourceActionsParams = Parameters<typeof useBrokerTopicResourceActions>[0];

type TopicResourceParams = Omit<
  BrokerTopicResourceActionsParams["topics"],
  "getCachedTopicDetail" | "setTopicDetailForServer"
>;

export type WorkspaceControllerResourcesParams = {
  topicDetailCache: WorkspaceResourceCompositionParams["topicDetailCache"];
  selectedServerResources: WorkspaceResourceCompositionParams["selectedServerResources"];
  brokers: BrokerTopicResourceActionsParams["brokers"];
  topics: TopicResourceParams;
};

export function useWorkspaceControllerResources({
  topicDetailCache,
  selectedServerResources,
  brokers,
  topics
}: WorkspaceControllerResourcesParams) {
  const {
    topicDetailCacheActions,
    selectedServerResourceSetters
  } = useWorkspaceResourceComposition({
    topicDetailCache,
    selectedServerResources
  });
  const { getCachedTopicDetail, setTopicDetailForServer } = topicDetailCacheActions;
  const {
    brokerActions,
    topicActions
  } = useBrokerTopicResourceActions({
    brokers,
    topics: {
      ...topics,
      getCachedTopicDetail,
      setTopicDetailForServer
    }
  });

  return {
    getCachedTopicDetail,
    setTopicDetailForServer,
    ...selectedServerResourceSetters,
    ...brokerActions,
    ...topicActions
  };
}
