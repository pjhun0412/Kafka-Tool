import { useTopicFavorites, useTopicRowSelectionActions } from "../actions";

type TopicListActionsParams = {
  favorites: Parameters<typeof useTopicFavorites>[0];
  rowSelection: Parameters<typeof useTopicRowSelectionActions>[0];
};

export function useTopicListActions(params: TopicListActionsParams) {
  const favoriteActions = useTopicFavorites(params.favorites);
  const rowSelectionActions = useTopicRowSelectionActions(params.rowSelection);

  return {
    favoriteActions,
    rowSelectionActions
  };
}
