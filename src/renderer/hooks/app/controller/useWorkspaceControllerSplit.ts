import { useSplitWorkspaceActions } from "../workspace/useSplitWorkspaceActions";
import { useWorkspaceDragComposition } from "../workspace/useWorkspaceDragComposition";

type SplitWorkspaceActionsParams = Parameters<typeof useSplitWorkspaceActions>[0];
type WorkspaceDragCompositionParams = Parameters<typeof useWorkspaceDragComposition>[0];

export function useWorkspaceControllerSplit({
  split,
  dragPayloads,
  dragDrop
}: {
  split: SplitWorkspaceActionsParams;
  dragPayloads: WorkspaceDragCompositionParams["payloads"];
  dragDrop: Omit<
    WorkspaceDragCompositionParams["drop"],
    "onCloseSplitPane" | "onOpenSplitFromPrimary" | "onMoveSplitToPrimary"
  >;
}) {
  const {
    viewActions: splitViewActions,
    paneActions: splitPaneActions
  } = useSplitWorkspaceActions(split);
  const { showSplitView } = splitViewActions;
  const {
    openSplitForTopic,
    moveSplitTopicToPrimary,
    removePrimaryTopicTabAfterSplit,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary
  } = splitPaneActions;
  const { payloadActions, dropActions } = useWorkspaceDragComposition({
    payloads: dragPayloads,
    drop: {
      ...dragDrop,
      onCloseSplitPane: closeSplitPane,
      onOpenSplitFromPrimary: async (payload) => {
        await openSplitForTopic(payload.serverId, payload.topic);
        await removePrimaryTopicTabAfterSplit(payload.topic);
      },
      onMoveSplitToPrimary: async (payload) => {
        await moveSplitTopicToPrimary(payload.topic);
      }
    }
  });

  return {
    showSplitView,
    openSplitForTopic,
    moveSplitTopicToPrimary,
    removePrimaryTopicTabAfterSplit,
    closeSplitPane,
    closeSplitTopicTab,
    promoteSplitPaneToPrimary,
    startTopicDrag: payloadActions.startTopicDrag,
    startSplitPaneDrag: payloadActions.startSplitPaneDrag,
    clearDragPayload: payloadActions.clearDragPayload,
    handleWorkspaceDragOver: dropActions.handleWorkspaceDragOver,
    handleWorkspaceDrop: dropActions.handleWorkspaceDrop
  };
}
