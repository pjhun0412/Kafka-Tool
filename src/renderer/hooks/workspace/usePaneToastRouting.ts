import type { PaneToastState, SplitPaneState, ToastState, WorkspacePaneId } from "../../uiTypes";

type PaneToastRoutingParams = {
  paneToast: PaneToastState;
  toast: ToastState;
  activeWorkspacePane: WorkspacePaneId;
  visibleSplitPane: SplitPaneState | null;
  selectedServerId: string;
  selectedTopic: string;
};

function isPaneToastVisible(paneToast: PaneToastState, pane: WorkspacePaneId, serverId: string, topic?: string) {
  if (!paneToast || paneToast.pane !== pane) return false;
  if (paneToast.serverId && paneToast.serverId !== serverId) return false;
  if (paneToast.topic && topic && paneToast.topic !== topic) return false;
  return true;
}

export function usePaneToastRouting({
  paneToast,
  toast,
  activeWorkspacePane,
  visibleSplitPane,
  selectedServerId,
  selectedTopic
}: PaneToastRoutingParams) {
  const fallbackToastPane: WorkspacePaneId = activeWorkspacePane === "split" && visibleSplitPane ? "split" : "primary";
  const fallbackPaneToast: PaneToastState = toast
    ? {
        pane: fallbackToastPane,
        message: toast.message,
        kind: toast.kind,
        serverId: fallbackToastPane === "split" && visibleSplitPane ? visibleSplitPane.serverId : selectedServerId,
        topic: fallbackToastPane === "split" && visibleSplitPane ? visibleSplitPane.topic : selectedTopic
      }
    : null;

  const primaryPaneToast = isPaneToastVisible(paneToast, "primary", selectedServerId, selectedTopic)
    ? paneToast
    : fallbackPaneToast?.pane === "primary"
      ? fallbackPaneToast
      : null;

  const splitPaneToast = visibleSplitPane && isPaneToastVisible(paneToast, "split", visibleSplitPane.serverId, visibleSplitPane.topic)
    ? paneToast
    : fallbackPaneToast?.pane === "split"
      ? fallbackPaneToast
      : null;

  return {
    primaryPaneToast,
    splitPaneToast
  };
}
