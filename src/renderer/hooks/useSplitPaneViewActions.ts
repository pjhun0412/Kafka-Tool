import type React from "react";
import type { TopicWorkView, WorkspaceActionTarget } from "../uiTypes";
import type { SplitPaneState, View } from "../uiTypes";
import { isTopicWorkView } from "../utils";

type RefreshForServer = (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;

export function useSplitPaneViewActions(params: {
  splitPane: SplitPaneState | null;
  setSplitPane: React.Dispatch<React.SetStateAction<SplitPaneState | null>>;
  brokersByServer: Record<string, unknown>;
  topicsByServer: Record<string, unknown>;
  groupsByServer: Record<string, unknown>;
  setTopicViewFor: (serverId: string, topic: string, view: TopicWorkView) => void;
  loadSplitTopicDetailSilent: (serverId: string, topic: string) => Promise<void>;
  refreshBrokersForServer: RefreshForServer;
  refreshTopicsForServer: RefreshForServer;
  refreshGroupsForServer: RefreshForServer;
}) {
  const showSplitView = (nextView: View) => {
    const pane = params.splitPane;
    if (!pane) return;

    params.setSplitPane((current) => current ? { ...current, view: nextView } : current);

    if (isTopicWorkView(nextView) && pane.topic) {
      params.setTopicViewFor(pane.serverId, pane.topic, nextView);
      if (nextView === "info" && !pane.detail) {
        void params.loadSplitTopicDetailSilent(pane.serverId, pane.topic);
      }
    }

    const target: WorkspaceActionTarget = { pane: "split", serverId: pane.serverId, topic: pane.topic };
    if (nextView === "brokers" && !params.brokersByServer[pane.serverId]) void params.refreshBrokersForServer(pane.serverId, target);
    if (nextView === "topics" && !params.topicsByServer[pane.serverId]) void params.refreshTopicsForServer(pane.serverId, target);
    if (nextView === "consumers" && !params.groupsByServer[pane.serverId]) void params.refreshGroupsForServer(pane.serverId, target);
  };

  return { showSplitView };
}
