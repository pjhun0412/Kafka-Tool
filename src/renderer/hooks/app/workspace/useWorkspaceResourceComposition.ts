import { useSelectedServerResourceSetters, useTopicDetailCache } from "../../workspace";

type WorkspaceResourceCompositionParams = {
  topicDetailCache: Parameters<typeof useTopicDetailCache>[0];
  selectedServerResources: Omit<
    Parameters<typeof useSelectedServerResourceSetters>[0],
    "setTopicDetailForServer"
  >;
};

export function useWorkspaceResourceComposition(params: WorkspaceResourceCompositionParams) {
  const topicDetailCacheActions = useTopicDetailCache(params.topicDetailCache);
  const selectedServerResourceSetters = useSelectedServerResourceSetters({
    ...params.selectedServerResources,
    setTopicDetailForServer: topicDetailCacheActions.setTopicDetailForServer
  });

  return {
    topicDetailCacheActions,
    selectedServerResourceSetters
  };
}
