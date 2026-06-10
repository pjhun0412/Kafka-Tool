import { useServerLifecycleActions } from "../actions";
import { useSidebarDragActions } from "../ui";

type ServerAppActionsParams = {
  lifecycle: Parameters<typeof useServerLifecycleActions>[0];
  sidebarDrag: Omit<Parameters<typeof useSidebarDragActions>[0], "reorderServer">;
};

export function useServerAppActions(params: ServerAppActionsParams) {
  const lifecycleActions = useServerLifecycleActions(params.lifecycle);
  const sidebarDragActions = useSidebarDragActions({
    ...params.sidebarDrag,
    reorderServer: lifecycleActions.reorderServer
  });

  return {
    lifecycleActions,
    sidebarDragActions
  };
}
