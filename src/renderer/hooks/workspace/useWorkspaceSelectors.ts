import type { Dispatch, SetStateAction } from "react";
import type { SortingState } from "@tanstack/react-table";
import type { SplitPaneState, View, WorkspacePaneId } from "../../uiTypes";
import {
  getConsumeTaskKey,
  getStreamingTopicKey,
  getWorkspaceTargetForServer
} from "../../workspaceState";

type WorkspaceSelectorsParams = {
  activeWorkspacePane: WorkspacePaneId;
  activeConsumeTaskKeys: string[];
  selectedServerId: string;
  selectedTopicByServer: Record<string, string>;
  streamingTopicsByServer: Record<string, string[]>;
  visibleSplitPane: SplitPaneState | null;
  view: View;
  setTopicGridSortingByServer: Dispatch<SetStateAction<Record<string, SortingState>>>;
};

export function useWorkspaceSelectors({
  activeWorkspacePane,
  activeConsumeTaskKeys,
  selectedServerId,
  selectedTopicByServer,
  streamingTopicsByServer,
  visibleSplitPane,
  view,
  setTopicGridSortingByServer
}: WorkspaceSelectorsParams) {
  function getWorkspaceTarget(serverId = selectedServerId, topic?: string) {
    return getWorkspaceTargetForServer({
      activeWorkspacePane,
      visibleSplitPane,
      selectedTopicByServer,
      selectedServerId,
      serverId,
      topic
    });
  }

  function isTopicStreaming(serverId: string, topic: string, pane: WorkspacePaneId) {
    return (streamingTopicsByServer[serverId] ?? []).includes(getStreamingTopicKey(pane, topic));
  }

  function isConsumeTaskActive(pane: WorkspacePaneId, serverId: string, topic: string) {
    return activeConsumeTaskKeys.includes(getConsumeTaskKey(pane, serverId, topic));
  }

  function updateTopicGridSortingForServer(
    serverId: string,
    updater: SortingState | ((current: SortingState) => SortingState)
  ) {
    setTopicGridSortingByServer((current) => {
      const previous = current[serverId] ?? [];
      return {
        ...current,
        [serverId]: typeof updater === "function" ? updater(previous) : updater
      };
    });
  }

  function getActiveWorkspaceView() {
    return visibleSplitPane && activeWorkspacePane === "split" ? visibleSplitPane.view : view;
  }

  return {
    getWorkspaceTargetForServer: getWorkspaceTarget,
    isTopicStreaming,
    isConsumeTaskActive,
    updateTopicGridSortingForServer,
    getActiveWorkspaceView
  };
}
