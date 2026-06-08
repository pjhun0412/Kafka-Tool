import type { Dispatch, SetStateAction } from "react";
import type { TopicDetail } from "../../../shared/types";
import type { SplitPaneState, View, WorkspacePaneId } from "../../uiTypes";
import { getNextTopicAfterTabClose, removeTopicTab } from "../../workspaceState";

type PrimaryTopicTabActionsParams = {
  selectedServerId: string;
  selectedTopic: string;
  openedTopicTabs: string[];
  splitPane: SplitPaneState | null;
  isTopicStreaming: (serverId: string, topic: string, pane: WorkspacePaneId) => boolean;
  stopConsume: (serverId?: string, topic?: string, pane?: WorkspacePaneId) => Promise<void>;
  clearConsumeStateForPane: (serverId: string, topic: string, pane: WorkspacePaneId) => void;
  promoteSplitPaneToPrimary: () => Promise<boolean>;
  selectPrimaryTopic: (topic: string) => Promise<void>;
  setOpenedTopicTabs: (action: string[] | ((current: string[]) => string[])) => void;
  setSelectedTopic: (topic: string) => void;
  setTopicDetail: (detail: TopicDetail | null) => void;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
};

export function usePrimaryTopicTabActions({
  selectedServerId,
  selectedTopic,
  openedTopicTabs,
  splitPane,
  isTopicStreaming,
  stopConsume,
  clearConsumeStateForPane,
  promoteSplitPaneToPrimary,
  selectPrimaryTopic,
  setOpenedTopicTabs,
  setSelectedTopic,
  setTopicDetail,
  setViewByServer
}: PrimaryTopicTabActionsParams) {
  async function closeTopicTab(topic: string) {
    if (isTopicStreaming(selectedServerId, topic, "primary")) {
      await stopConsume(selectedServerId, topic, "primary");
    }
    const nextTabs = removeTopicTab(openedTopicTabs, topic);
    setOpenedTopicTabs(nextTabs);
    clearConsumeStateForPane(selectedServerId, topic, "primary");
    if (nextTabs.length === 0 && splitPane?.serverId === selectedServerId) {
      await promoteSplitPaneToPrimary();
      return;
    }
    if (selectedTopic !== topic) {
      return;
    }
    const nextTopic = getNextTopicAfterTabClose(selectedTopic, topic, nextTabs);
    if (nextTopic) {
      await selectPrimaryTopic(nextTopic);
    } else {
      setSelectedTopic("");
      setTopicDetail(null);
      setViewByServer((current) => ({ ...current, [selectedServerId]: "topics" }));
    }
  }

  return { closeTopicTab };
}
