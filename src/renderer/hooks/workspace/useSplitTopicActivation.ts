import type { Dispatch, SetStateAction } from "react";
import type { SplitPaneState, TopicWorkView, WorkspacePaneId } from "../../uiTypes";
import { activateTopicInSplitPane } from "../../workspaceState";

type SplitTopicActivationParams = {
  splitPane: SplitPaneState | null;
  getTopicViewFor: (serverId: string, topic: string) => TopicWorkView;
  loadSplitTopicDetail: (serverId: string, topic: string) => Promise<void>;
  setSplitPane: Dispatch<SetStateAction<SplitPaneState | null>>;
  setActiveWorkspacePane: Dispatch<SetStateAction<WorkspacePaneId>>;
};

export function useSplitTopicActivation({
  splitPane,
  getTopicViewFor,
  loadSplitTopicDetail,
  setSplitPane,
  setActiveWorkspacePane
}: SplitTopicActivationParams) {
  async function activateSplitTopic(topic: string, view?: TopicWorkView) {
    const pane = splitPane;
    if (!pane || !topic) return;
    const nextView = view ?? getTopicViewFor(pane.serverId, topic);
    const shouldLoadDetail = nextView === "info" && (pane.topic !== topic || !pane.detail);
    setActiveWorkspacePane("split");
    setSplitPane((current) => activateTopicInSplitPane(current, topic, nextView, shouldLoadDetail));
    if (shouldLoadDetail) {
      await loadSplitTopicDetail(pane.serverId, topic);
    }
  }

  return { activateSplitTopic };
}
