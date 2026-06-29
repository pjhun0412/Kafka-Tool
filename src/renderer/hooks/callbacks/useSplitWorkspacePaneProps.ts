import type { WorkspaceAppLayoutSplitPaneProps } from "../../components/workspace/WorkspaceAppLayout";
import type { useSplitPaneCallbacks } from "./useSplitPaneCallbacks";

type SplitPaneCallbackProps =
  | "onClose"
  | "onActivate"
  | "onDragStart"
  | "onDragEnd"
  | "onView"
  | "onTopic"
  | "onOpenTopic"
  | "onCloseTopic"
  | "onTopicDragStart"
  | "onTopicDragEnd"
  | "onRefresh"
  | "onOpenSchema"
  | "onToggleTopicSelected"
  | "onToggleAllTopicsSelected"
  | "onCopySelectedTopics"
  | "onCreateTopic"
  | "onClearTopicMessages"
  | "onPurgeSelectedTopics"
  | "onDeleteSelectedTopics"
  | "onToggleTopicFavorite"
  | "onSelectGroup"
  | "onDeleteConsumerGroups"
  | "onResetConsumerGroupOffsets"
  | "onBackGroup"
  | "onRefreshGroups"
  | "onRefreshGroupDetail"
  | "onUpdateConsume"
  | "onOffsetOrder"
  | "onOffsetPage"
  | "onStartConsume"
  | "onStopConsume"
  | "onSendToProduce"
  | "onReplayMessage"
  | "onConnectReplayServer"
  | "onExport"
  | "onExportAll"
  | "onMessagePaneHeight"
  | "onProduceKey"
  | "onProduceHeaders"
  | "onProduceValue"
  | "onProduce"
  | "onProduceDraft";

type SplitWorkspacePanePropsParams = Omit<WorkspaceAppLayoutSplitPaneProps, SplitPaneCallbackProps> & {
  callbacks: ReturnType<typeof useSplitPaneCallbacks>;
};

export function createSplitWorkspacePaneProps({
  callbacks,
  ...paneProps
}: SplitWorkspacePanePropsParams): WorkspaceAppLayoutSplitPaneProps {
  return {
    ...paneProps,
    onClose: callbacks.close,
    onActivate: callbacks.activate,
    onDragStart: callbacks.dragStart,
    onDragEnd: callbacks.dragEnd,
    onView: callbacks.view,
    onTopic: callbacks.selectTopic,
    onOpenTopic: callbacks.openTopic,
    onCloseTopic: callbacks.closeTopic,
    onTopicDragStart: callbacks.topicDragStart,
    onTopicDragEnd: callbacks.topicDragEnd,
    onRefresh: callbacks.refresh,
    onOpenSchema: callbacks.openSchema,
    onToggleTopicSelected: callbacks.toggleTopicSelected,
    onToggleAllTopicsSelected: callbacks.toggleAllTopicsSelected,
    onCopySelectedTopics: callbacks.copySelectedTopics,
    onCreateTopic: callbacks.createTopic,
    onClearTopicMessages: callbacks.clearTopicMessages,
    onPurgeSelectedTopics: callbacks.purgeSelectedTopics,
    onDeleteSelectedTopics: callbacks.deleteSelectedTopics,
    onToggleTopicFavorite: callbacks.toggleTopicFavorite,
    onSelectGroup: callbacks.selectGroup,
    onDeleteConsumerGroups: callbacks.deleteConsumerGroups,
    onResetConsumerGroupOffsets: callbacks.resetConsumerGroupOffsets,
    onBackGroup: callbacks.backGroup,
    onRefreshGroups: callbacks.refreshGroups,
    onRefreshGroupDetail: callbacks.refreshGroupDetail,
    onUpdateConsume: callbacks.updateConsume,
    onOffsetOrder: callbacks.offsetOrder,
    onOffsetPage: callbacks.offsetPage,
    onStartConsume: callbacks.startConsume,
    onStopConsume: callbacks.stopConsume,
    onSendToProduce: callbacks.sendToProduce,
    onReplayMessage: callbacks.replayMessage,
    onConnectReplayServer: callbacks.connectReplayServer,
    onExport: callbacks.exportMessages,
    onExportAll: callbacks.exportAll,
    onMessagePaneHeight: callbacks.messagePaneHeight,
    onProduceKey: callbacks.produceKey,
    onProduceHeaders: callbacks.produceHeaders,
    onProduceValue: callbacks.produceValue,
    onProduce: callbacks.produce,
    onProduceDraft: callbacks.produceDraft
  };
}
