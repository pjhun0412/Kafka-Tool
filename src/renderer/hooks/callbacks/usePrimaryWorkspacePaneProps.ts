import type { WorkspaceAppLayoutPrimaryPaneProps } from "../../components/workspace/WorkspaceAppLayout";
import type { usePrimaryPaneCallbacks } from "./usePrimaryPaneCallbacks";

type PrimaryPaneCallbackProps =
  | "onActivate"
  | "onToggleSidebar"
  | "onCloseCluster"
  | "onServerView"
  | "onRefreshServerView"
  | "onTopic"
  | "onCloseTopic"
  | "onTopicDragStart"
  | "onTopicDragEnd"
  | "onTopicView"
  | "onOpenSchema"
  | "onRefreshTopicView"
  | "onOpenTopic"
  | "onSelectTopic"
  | "onToggleTopicSelected"
  | "onToggleAllTopicsSelected"
  | "onCopySelectedTopics"
  | "onPurgeSelectedTopics"
  | "onDeleteSelectedTopics"
  | "onToggleTopicFavorite"
  | "onSelectGroup"
  | "onDeleteConsumerGroups"
  | "onBackGroup"
  | "onRefreshGroups"
  | "onRefreshGroupDetail"
  | "onUpdateConsume"
  | "onOffsetOrder"
  | "onOffsetPage"
  | "onStartConsume"
  | "onStopConsume"
  | "onSendToProduce"
  | "onExport"
  | "onExportAll"
  | "onMessagePaneHeight"
  | "onProduceKey"
  | "onProduceHeaders"
  | "onProduceValue"
  | "onProduce";

type PrimaryWorkspacePanePropsParams = Omit<WorkspaceAppLayoutPrimaryPaneProps, PrimaryPaneCallbackProps> & {
  callbacks: ReturnType<typeof usePrimaryPaneCallbacks>;
};

export function createPrimaryWorkspacePaneProps({
  callbacks,
  ...paneProps
}: PrimaryWorkspacePanePropsParams): WorkspaceAppLayoutPrimaryPaneProps {
  return {
    ...paneProps,
    onActivate: callbacks.activate,
    onToggleSidebar: callbacks.toggleSidebar,
    onCloseCluster: callbacks.closeCluster,
    onServerView: callbacks.serverView,
    onRefreshServerView: callbacks.refreshServerView,
    onTopic: callbacks.selectTopic,
    onCloseTopic: callbacks.closeTopic,
    onTopicDragStart: callbacks.topicDragStart,
    onTopicDragEnd: callbacks.topicDragEnd,
    onTopicView: callbacks.topicView,
    onOpenSchema: callbacks.openSchema,
    onRefreshTopicView: callbacks.refreshTopicView,
    onOpenTopic: callbacks.openTopic,
    onSelectTopic: callbacks.selectTopicFromTable,
    onToggleTopicSelected: callbacks.toggleTopicSelected,
    onToggleAllTopicsSelected: callbacks.toggleAllTopicsSelected,
    onCopySelectedTopics: callbacks.copySelectedTopics,
    onPurgeSelectedTopics: callbacks.purgeSelectedTopics,
    onDeleteSelectedTopics: callbacks.deleteSelectedTopics,
    onToggleTopicFavorite: callbacks.toggleTopicFavorite,
    onSelectGroup: callbacks.selectGroup,
    onDeleteConsumerGroups: callbacks.deleteConsumerGroups,
    onBackGroup: callbacks.backGroup,
    onRefreshGroups: callbacks.refreshGroups,
    onRefreshGroupDetail: callbacks.refreshGroupDetail,
    onUpdateConsume: callbacks.updateConsume,
    onOffsetOrder: callbacks.offsetOrder,
    onOffsetPage: callbacks.offsetPage,
    onStartConsume: callbacks.startConsume,
    onStopConsume: callbacks.stopConsume,
    onSendToProduce: callbacks.sendToProduce,
    onExport: callbacks.exportMessages,
    onExportAll: callbacks.exportAll,
    onMessagePaneHeight: callbacks.messagePaneHeight,
    onProduceKey: callbacks.produceKey,
    onProduceHeaders: callbacks.produceHeaders,
    onProduceValue: callbacks.produceValue,
    onProduce: callbacks.produce
  };
}
