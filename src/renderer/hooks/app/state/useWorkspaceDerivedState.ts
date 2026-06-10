import { emptyProduceDraft } from "../../state";

type WorkspaceDerivedStateParams = {
  selectedServerId: string;
  selectedTopicByServer: Record<string, string>;
  viewByServer: Record<string, string>;
  openedTopicTabsByServer: Record<string, string[]>;
  topicDetailByServer: Record<string, unknown>;
  consumeStatesByServer: Record<string, Record<string, unknown>>;
  splitPane: { serverId: string; topic: string } | null;
  getDefaultConsumeState: () => unknown;
  getProduceDraft: (serverId: string, topic: string) => typeof emptyProduceDraft;
};

export function useWorkspaceDerivedState(params: WorkspaceDerivedStateParams) {
  const selectedTopic = params.selectedTopicByServer[params.selectedServerId] ?? "";
  const view = params.viewByServer[params.selectedServerId] ?? (selectedTopic ? "info" : "topics");
  const openedTopicTabs = params.openedTopicTabsByServer[params.selectedServerId] ?? [];
  const topicDetail = params.topicDetailByServer[params.selectedServerId] ?? null;
  const consumeStates = params.consumeStatesByServer[params.selectedServerId] ?? {};
  const selectedDefaultConsumeState = params.getDefaultConsumeState();
  const visibleSplitPane = params.splitPane?.serverId === params.selectedServerId ? params.splitPane : null;
  const selectedProduceDraft = params.getProduceDraft(params.selectedServerId, selectedTopic);
  const splitProduceDraft = visibleSplitPane
    ? params.getProduceDraft(visibleSplitPane.serverId, visibleSplitPane.topic)
    : emptyProduceDraft;

  return {
    selectedTopic,
    view,
    openedTopicTabs,
    topicDetail,
    consumeStates,
    selectedDefaultConsumeState,
    visibleSplitPane,
    selectedProduceDraft,
    splitProduceDraft
  };
}
