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
  TopicDetail,
  TopicSummary
} from "../../../../shared/types";
import type { OffsetOrder, PaneToastState, TopicConsumeState, View } from "../../../uiTypes";
import type { AppLanguage } from "../../../i18n";
import type { ProduceDraftOverride } from "../../../hooks/actions/useProduceActions";
import type { ReplayDraft, ReplayPayloadOptions, ReplayTargetServer } from "../../../replayTypes";
import { PaneToastView } from "../feedback/WorkspaceFeedback";
import { ClusterTabs } from "../tabs/ClusterTabs";
import { OpenedTopicTabs } from "../tabs/OpenedTopicTabs";
import { ServerWorkTabs, TopicWorkTabs } from "../tabs/WorkspaceModeTabs";
import { WorkspacePaneContent } from "../WorkspacePaneContent";
import { WorkspaceTopbar } from "../WorkspaceTopbar";

export function PrimaryWorkspacePane(props: {
  server?: ServerProfile;
  sidebarCollapsed: boolean;
  openClusterIds: string[];
  servers: ServerProfile[];
  selectedServerId: string;
  connectedServerIds: string[];
  failedServerIds: string[];
  activeWorkspaceView: View;
  loading: boolean;
  isSelectedServerConnected: boolean;
  active: boolean;
  topicTabs: string[];
  previewTopic: string;
  topicActivities: Record<string, { intervalProduce?: boolean; live?: boolean }>;
  selectedTopic: string;
  view: View;
  detail: TopicDetail | null;
  topics: TopicSummary[];
  replayTargets: ReplayTargetServer[];
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
  isConsuming: boolean;
  isQuerying: boolean;
  messagePaneHeight: number;
  manualAvroSchemas: Record<string, ManualAvroSchema>;
  produceKey: string;
  produceHeaders: string;
  produceValue: string;
  produceTemplates: ProduceTemplatePreference[];
  paneToast: PaneToastState;
  language: AppLanguage;
  hasAvroSchema: (topic: string) => boolean;
  onActivate: () => void;
  onToggleSidebar: () => void;
  onSelectCluster: (serverId: string) => void;
  onCloseCluster: (serverId: string) => void;
  onServerView: (view: View) => void;
  onRefreshServerView: () => void;
  onTopic: (topic: string) => void;
  onCloseTopic: (topic: string) => void;
  onTopicDragStart: (event: React.DragEvent, topic: string) => void;
  onTopicDragEnd: () => void;
  onTopicView: (view: View) => void;
  onOpenSchema: () => void;
  onRefreshTopicView: () => void;
  onOpenTopic: (topic: string) => void;
  onSelectTopic: (topic: string) => void;
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
  onSendToProduce: (message: ConsumedMessage, targetTopic?: string, targetServerId?: string, payload?: ReplayPayloadOptions) => void;
  onReplayMessage: (serverId: string, topic: string, draft: ReplayDraft) => Promise<void>;
  onConnectReplayServer: (serverId: string) => Promise<boolean>;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onMessagePaneHeight: (value: number) => void;
  onProduceKey: (value: string) => void;
  onProduceHeaders: (value: string) => void;
  onProduceValue: (value: string) => void;
  onProduceTemplates: (templates: ProduceTemplatePreference[]) => void;
  onProduce: () => void;
  onProduceDraft: (draft: ProduceDraftOverride) => Promise<void>;
}) {
  const [intervalTopicActivities, setIntervalTopicActivities] = React.useState<Record<string, boolean>>({});
  const isTopicView = props.view === "info" || props.view === "consume" || props.view === "produce" || props.view === "settings";
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
    props.onTopicView("settings");
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("topic-settings-edit", {
        detail: { serverId: props.selectedServerId, topic: props.selectedTopic }
      }));
    }, 0);
  }

  return (
    <section
      className={props.active ? "workspace-pane primary-pane active-pane" : "workspace-pane primary-pane inactive-pane"}
      onMouseDown={props.onActivate}
    >
      <WorkspaceTopbar server={props.server} sidebarCollapsed={props.sidebarCollapsed} onToggleSidebar={props.onToggleSidebar} />

      <ClusterTabs
        openClusterIds={props.openClusterIds}
        servers={props.servers}
        selectedServerId={props.selectedServerId}
        connectedServerIds={props.connectedServerIds}
        failedServerIds={props.failedServerIds}
        onSelect={props.onSelectCluster}
        onClose={props.onCloseCluster}
      />

      <ServerWorkTabs
        activeView={props.activeWorkspaceView}
        disabled={!props.isSelectedServerConnected}
        loading={props.loading}
        onView={props.onServerView}
        onRefresh={props.onRefreshServerView}
      />

      <section
        className={props.active ? "primary-topic-pane active-pane" : "primary-topic-pane inactive-pane"}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            props.onActivate();
          }
        }}
      >
        {props.paneToast && <PaneToastView toast={props.paneToast} language={props.language} />}
        {isTopicView && (
          <>
            <OpenedTopicTabs
              topics={props.topicTabs}
              selectedTopic={props.selectedTopic}
              previewTopic={props.previewTopic}
              topicActivities={topicActivities}
              hasAvroSchema={props.hasAvroSchema}
              onActivate={props.onActivate}
              onSelect={props.onTopic}
              onClose={props.onCloseTopic}
              onDragStart={props.onTopicDragStart}
              onDragEnd={props.onTopicDragEnd}
            />

            <TopicWorkTabs
              activeView={props.view}
              disabled={!props.selectedTopic}
              refreshDisabled={!props.isSelectedServerConnected || props.loading}
              onView={props.onTopicView}
              onOpenSchema={props.onOpenSchema}
              onRefresh={props.onRefreshTopicView}
              onEditSettings={editTopicSettings}
            />
          </>
        )}

        <WorkspacePaneContent
          serverId={props.selectedServerId}
          serverName={props.server?.name ?? props.selectedServerId}
          view={props.view}
          topic={props.selectedTopic}
          openedTopicTabs={props.topicTabs}
          language={props.language}
          isConnected={props.isSelectedServerConnected}
          detail={props.detail}
          topics={props.topics}
          replayTargets={props.replayTargets}
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
          onSelectTopic={props.onSelectTopic}
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
          onReplayMessage={props.onReplayMessage}
          onConnectReplayServer={props.onConnectReplayServer}
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
    </section>
  );
}
