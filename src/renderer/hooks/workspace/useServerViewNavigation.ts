import type { Dispatch, SetStateAction } from "react";
import type { BrokerSummary, ConsumerGroupSummary, TopicSummary } from "../../../shared/types";
import type { SplitPaneState, View, WorkspaceActionTarget, WorkspacePaneId } from "../../uiTypes";

type ServerViewNavigationParams = {
  activeWorkspacePane: WorkspacePaneId;
  selectedServerId: string;
  view: View;
  visibleSplitPane: SplitPaneState | null;
  brokersByServer: Record<string, BrokerSummary[]>;
  topicsByServer: Record<string, TopicSummary[]>;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
  activateSelectedTopicView: () => void;
  activateSplitSelectedTopicView: () => void;
  refreshBrokers: () => Promise<void>;
  refreshTopics: () => Promise<void>;
  refreshGroups: () => Promise<void>;
  refreshBrokersForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  refreshTopicsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  refreshGroupsForServer: (serverId: string, target?: WorkspaceActionTarget) => Promise<void>;
  setSplitPane: Dispatch<SetStateAction<SplitPaneState | null>>;
  setView: (view: View) => void;
};

export function useServerViewNavigation({
  activeWorkspacePane,
  selectedServerId,
  view,
  visibleSplitPane,
  brokersByServer,
  topicsByServer,
  groupsByServer,
  activateSelectedTopicView,
  activateSplitSelectedTopicView,
  refreshBrokers,
  refreshTopics,
  refreshGroups,
  refreshBrokersForServer,
  refreshTopicsForServer,
  refreshGroupsForServer,
  setSplitPane,
  setView
}: ServerViewNavigationParams) {
  function showServerViewInActivePane(nextView: View) {
    if (visibleSplitPane && activeWorkspacePane === "split") {
      const pane = visibleSplitPane;
      if (pane.view === nextView) {
        activateSplitSelectedTopicView();
        return;
      }
      setSplitPane((current) => current && current.serverId === pane.serverId ? { ...current, view: nextView } : current);
      const target = { pane: "split", serverId: pane.serverId, topic: pane.topic } satisfies WorkspaceActionTarget;
      if (nextView === "brokers" && !brokersByServer[pane.serverId]) void refreshBrokersForServer(pane.serverId, target);
      if (nextView === "topics" && !topicsByServer[pane.serverId]) void refreshTopicsForServer(pane.serverId, target);
      if (nextView === "consumers" && !groupsByServer[pane.serverId]) void refreshGroupsForServer(pane.serverId, target);
      return;
    }

    if (view === nextView) {
      activateSelectedTopicView();
      return;
    }
    setView(nextView);
    if (nextView === "brokers" && !brokersByServer[selectedServerId]) void refreshBrokers();
    if (nextView === "topics" && !topicsByServer[selectedServerId]) void refreshTopics();
    if (nextView === "consumers" && !groupsByServer[selectedServerId]) void refreshGroups();
  }

  return {
    showServerViewInActivePane
  };
}
