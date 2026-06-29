import React from "react";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import type {
  BrokerSummary,
  ConsumedMessage,
  ConsumerGroupLagDetail,
  ConsumerGroupOffsetResetRequest,
  ConsumerGroupSummary,
  ManualAvroSchema,
  MessageExportFormat,
  ProduceTemplatePreference,
  ServerProfile,
  TopicSummary
} from "../../../../shared/types";
import type { OffsetOrder, PaneToastState, SplitPaneState, TopicConsumeState, View } from "../../../uiTypes";
import type { AppLanguage } from "../../../i18n";
import type { ProduceDraftOverride } from "../../../hooks/actions/useProduceActions";
import { PaneToastView } from "../feedback/WorkspaceFeedback";
import { OpenedTopicTabs } from "../tabs/OpenedTopicTabs";
import { TopicWorkTabs } from "../tabs/WorkspaceModeTabs";
import { WorkspacePaneContent } from "../WorkspacePaneContent";

export function SplitWorkspacePane(props: {
  pane: SplitPaneState;
  server: ServerProfile;
  topics: TopicSummary[];
  brokers: BrokerSummary[];
  groups: ConsumerGroupSummary[];
  favoriteTopicNames: string[];
  selectedTopics: string[];
  topicSorting?: SortingState;
  onTopicSortingChange?: OnChangeFn<SortingState>;
  selectedGroupId: string;
  selectedGroupLag: ConsumerGroupLagDetail | null;
  groupDetailsById: Record<string, ConsumerGroupLagDetail>;
  consumeState: TopicConsumeState;
  isConnected: boolean;
  isConsuming: boolean;
  isQuerying: boolean;
  messagePaneHeight: number;
  active: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart: (event: React.DragEvent) => void;
  onDragEnd: () => void;
  onView: (view: View) => void;
  onTopic: (topic: string) => void;
  onOpenTopic: (topic: string) => void;
  onCloseTopic: (topic: string) => void;
  onTopicDragStart: (event: React.DragEvent, topic: string) => void;
  onTopicDragEnd: () => void;
  onRefresh: () => void;
  onOpenSchema: () => void;
  manualAvroSchemas: Record<string, ManualAvroSchema>;
  onToggleTopicSelected: (topic: string) => void;
  onToggleAllTopicsSelected: (topics: string[]) => void;
  onCopySelectedTopics: () => void;
  onCreateTopic: () => void;
  onClearTopicMessages: () => void;
  onPurgeSelectedTopics: () => void;
  onDeleteSelectedTopics: () => void;
  onToggleTopicFavorite: (topic: string) => void;
  onSelectGroup: (groupId: string) => void;
  onDeleteConsumerGroups: (groupIds: string[]) => void;
  onResetConsumerGroupOffsets: (request: ConsumerGroupOffsetResetRequest) => Promise<void>;
  onBackGroup: () => void;
  onRefreshGroups: () => void;
  onRefreshGroupDetail: () => void;
  onUpdateConsume: (patch: Partial<TopicConsumeState>) => void;
  onOffsetOrder: (value: OffsetOrder) => void;
  onOffsetPage: (direction: "prev" | "next") => void;
  onStartConsume: () => void;
  onStopConsume: () => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onMessagePaneHeight: (value: number) => void;
  produceKey: string;
  produceHeaders: string;
  produceValue: string;
  produceTemplates: ProduceTemplatePreference[];
  topicActivities: Record<string, { intervalProduce?: boolean; live?: boolean }>;
  onProduceKey: (value: string) => void;
  onProduceHeaders: (value: string) => void;
  onProduceValue: (value: string) => void;
  onProduceTemplates: (templates: ProduceTemplatePreference[]) => void;
  onProduce: () => void;
  onProduceDraft: (draft: ProduceDraftOverride) => Promise<void>;
  paneToast: PaneToastState;
  language: AppLanguage;
}) {
  const [intervalTopicActivities, setIntervalTopicActivities] = React.useState<Record<string, boolean>>({});
  const isTopicView = props.pane.view === "info" || props.pane.view === "consume" || props.pane.view === "produce" || props.pane.view === "settings";
  const topicActivities = React.useMemo(() => {
    const next = { ...props.topicActivities };
    Object.entries(intervalTopicActivities).forEach(([topic, running]) => {
      if (running) {
        next[topic] = { ...(next[topic] ?? {}), intervalProduce: true };
      }
    });
    return next;
  }, [intervalTopicActivities, props.topicActivities]);

  const setProduceIntervalActivity = React.useCallback((topic: string, running: boolean) => {
    setIntervalTopicActivities((current) => {
      if (running) return { ...current, [topic]: true };
      const { [topic]: _removed, ...next } = current;
      return next;
    });
  }, []);

  function editTopicSettings() {
    props.onView("settings");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("topic-settings-edit", {
        detail: { serverId: props.pane.serverId, topic: props.pane.topic }
      }));
    }, 0);
  }

  return (
    <section
      className={props.active ? "workspace-pane split-pane active-pane" : "workspace-pane split-pane inactive-pane"}
      onMouseDown={props.onActivate}
    >
      {props.paneToast && <PaneToastView toast={props.paneToast} language={props.language} />}
      {isTopicView && (
        <>
          <div className="split-topic-tabs-row">
            <OpenedTopicTabs
              topics={props.pane.topicTabs}
              selectedTopic={props.pane.topic}
              previewTopic={props.pane.previewTopic}
              topicActivities={topicActivities}
              hasAvroSchema={(topic) => Boolean(props.manualAvroSchemas[topic])}
              onActivate={props.onActivate}
              onSelect={props.onTopic}
              onClose={props.onCloseTopic}
              onDragStart={props.onTopicDragStart}
              onDragEnd={props.onTopicDragEnd}
            />
          </div>
          <TopicWorkTabs
            activeView={props.pane.view}
            disabled={!props.pane.topic}
            refreshDisabled={!props.pane.topic}
            onView={props.onView}
            onOpenSchema={props.onOpenSchema}
            onRefresh={props.onRefresh}
            onEditSettings={editTopicSettings}
          />
        </>
      )}

      <WorkspacePaneContent
        className="split-content-grid"
        serverId={props.pane.serverId}
        view={props.pane.view}
        topic={props.pane.topic}
        openedTopicTabs={props.pane.topicTabs}
        language={props.language}
        isConnected={props.isConnected}
        detail={props.pane.detail}
        topics={props.topics}
        brokers={props.brokers}
        groups={props.groups}
        favoriteTopicNames={props.favoriteTopicNames}
        selectedTopics={props.selectedTopics}
        topicSorting={props.topicSorting}
        onTopicSortingChange={props.onTopicSortingChange}
        selectedGroupId={props.selectedGroupId}
        selectedGroupLag={props.selectedGroupLag}
        groupDetailsById={props.groupDetailsById}
        consumeState={props.consumeState}
        isConsuming={props.isConsuming}
        isQuerying={props.isQuerying}
        messagePaneHeight={props.messagePaneHeight}
        manualAvroSchemas={props.manualAvroSchemas}
        produceKey={props.produceKey}
        produceHeaders={props.produceHeaders}
        produceValue={props.produceValue}
        produceTemplates={props.produceTemplates}
        onOpenTopic={props.onOpenTopic}
        onSelectTopic={props.onTopic}
        onToggleTopicSelected={props.onToggleTopicSelected}
        onToggleAllTopicsSelected={props.onToggleAllTopicsSelected}
        onCopySelectedTopics={props.onCopySelectedTopics}
        onCreateTopic={props.onCreateTopic}
        onClearTopicMessages={props.onClearTopicMessages}
        onPurgeSelectedTopics={props.onPurgeSelectedTopics}
        onDeleteSelectedTopics={props.onDeleteSelectedTopics}
        onToggleTopicFavorite={props.onToggleTopicFavorite}
        onSelectGroup={props.onSelectGroup}
        onDeleteConsumerGroups={props.onDeleteConsumerGroups}
        onResetConsumerGroupOffsets={props.onResetConsumerGroupOffsets}
        onBackGroup={props.onBackGroup}
        onRefreshGroups={props.onRefreshGroups}
        onRefreshGroupDetail={props.onRefreshGroupDetail}
        onUpdateConsume={props.onUpdateConsume}
        onOffsetOrder={props.onOffsetOrder}
        onOffsetPage={props.onOffsetPage}
        onStartConsume={props.onStartConsume}
        onStopConsume={props.onStopConsume}
        onSendToProduce={props.onSendToProduce}
        onExport={props.onExport}
        onExportAll={props.onExportAll}
        onMessagePaneHeight={props.onMessagePaneHeight}
        onProduceKey={props.onProduceKey}
        onProduceHeaders={props.onProduceHeaders}
        onProduceValue={props.onProduceValue}
        onProduceTemplates={props.onProduceTemplates}
        onProduce={props.onProduce}
        onProduceDraft={props.onProduceDraft}
        onProduceIntervalActivity={setProduceIntervalActivity}
      />
    </section>
  );
}
