import type { Dispatch, SetStateAction } from "react";
import type { SplitPaneState, TopicWorkView, View } from "../../uiTypes";
import { isTopicWorkView } from "../../utils";

type TopicViewActionsParams = {
  selectedServerId: string;
  selectedTopic: string;
  visibleSplitPane: SplitPaneState | null;
  topicViewByServer: Record<string, Record<string, TopicWorkView>>;
  setViewByServer: Dispatch<SetStateAction<Record<string, View>>>;
  setTopicViewByServer: Dispatch<SetStateAction<Record<string, Record<string, TopicWorkView>>>>;
  setSplitPane: Dispatch<SetStateAction<SplitPaneState | null>>;
  loadSplitTopicDetailSilent?: (serverId: string, topic: string) => void;
};

export function useTopicViewActions({
  selectedServerId,
  selectedTopic,
  visibleSplitPane,
  topicViewByServer,
  setViewByServer,
  setTopicViewByServer,
  setSplitPane,
  loadSplitTopicDetailSilent
}: TopicViewActionsParams) {
  function setTopicViewFor(serverId: string, topic: string, view: TopicWorkView) {
    setTopicViewByServer((current) => ({
      ...current,
      [serverId]: {
        ...(current[serverId] ?? {}),
        [topic]: view
      }
    }));
  }

  function setView(view: View) {
    if (!selectedServerId) return;
    setViewByServer((current) => ({ ...current, [selectedServerId]: view }));
    if (isTopicWorkView(view) && selectedTopic) {
      setTopicViewFor(selectedServerId, selectedTopic, view);
    }
  }

  function getTopicViewFor(serverId: string, topic: string) {
    return topicViewByServer[serverId]?.[topic] ?? "info";
  }

  function getTopicView(topic: string) {
    return getTopicViewFor(selectedServerId, topic);
  }

  function activateTopicView(topic: string) {
    if (!selectedServerId) return;
    setViewByServer((current) => ({ ...current, [selectedServerId]: getTopicView(topic) }));
  }

  function activateSelectedTopicView() {
    if (!selectedTopic) return;
    activateTopicView(selectedTopic);
  }

  function activateSplitSelectedTopicView() {
    const pane = visibleSplitPane;
    if (!pane?.topic) return;
    const nextView = getTopicViewFor(pane.serverId, pane.topic);
    setSplitPane((current) => current && current.serverId === pane.serverId
      ? { ...current, view: nextView }
      : current);
    if (nextView === "info" && !pane.detail) {
      loadSplitTopicDetailSilent?.(pane.serverId, pane.topic);
    }
  }

  return {
    setView,
    setTopicViewFor,
    getTopicViewFor,
    getTopicView,
    activateTopicView,
    activateSelectedTopicView,
    activateSplitSelectedTopicView
  };
}
