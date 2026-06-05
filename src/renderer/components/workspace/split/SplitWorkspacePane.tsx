import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { Braces, Calendar, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Copy, Download, EyeOff, Filter, HelpCircle, Layers, Play, RefreshCw, Send, Sparkles, Square, Star, Trash2, X, XCircle } from "lucide-react";
import type { BrokerSummary, ConsumedMessage, ConsumerGroupLagDetail, ConsumerGroupLagRow, ConsumerGroupSummary, ManualAvroSchema, MessageExportFormat, ServerProfile, TopicDetail, TopicSummary } from "../../../../shared/types";
import { Button, IconButton } from "../../ui";
import { DataGrid } from "../../DataGrid";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, SplitPaneState, TopicConsumeState, View } from "../../../uiTypes";
import { filterMessages } from "../../../messageFilters";
import { formatCompactNumber, formatCount, formatHeaders, formatMessagePayload, formatPercent, formatTimestamp, getEpochTitle, getPartitionColor, parseJson, previewHeaders, previewValue, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";
import { ConsumePanel } from "../consume/ConsumePanel";
import { ProducePanel } from "../produce/ProducePanel";
import { BrokersPanel, ServerTopicsPanel, TopicPanel } from "../topics";
import { ConsumerGroupsPanel } from "../groups/ConsumerGroupsPanel";
import { PaneToastView, type PaneToastState } from "../feedback/WorkspaceFeedback";

function toLocalDateTimeInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDefaultTimeRangeValues(state: Pick<TopicConsumeState, "timeStart" | "timeEnd">) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return {
    timeStart: state.timeStart || toLocalDateTimeInputValue(startOfToday),
    timeEnd: state.timeEnd || toLocalDateTimeInputValue(now)
  };
}

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
  onPurgeSelectedTopics: () => void;
  onDeleteSelectedTopics: () => void;
  onToggleTopicFavorite: (topic: string) => void;
  onSelectGroup: (groupId: string) => void;
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
  onProduceKey: (value: string) => void;
  onProduceHeaders: (value: string) => void;
  onProduceValue: (value: string) => void;
  onProduce: () => void;
  paneToast: PaneToastState;
}) {
  const topicViews: View[] = ["info", "consume", "produce"];
  const isTopicView = props.pane.view === "info" || props.pane.view === "consume" || props.pane.view === "produce";
  const topicDetail = props.pane.detail;

  return (
    <section
      className={props.active ? "workspace-pane split-pane active-pane" : "workspace-pane split-pane inactive-pane"}
      onMouseDown={props.onActivate}
    >
      {props.paneToast && <PaneToastView toast={props.paneToast} />}
      {isTopicView && (
        <>
          <div className="split-topic-tabs-row">
          <div className="topic-tabs" aria-label="Opened split topics">
            {props.pane.topicTabs.length === 0 ? (
              <div className="topic-tabs-empty">토픽을 선택하세요.</div>
            ) : props.pane.topicTabs.map((topic) => (
              <button
                key={topic}
                className={topic === props.pane.topic ? "topic-tab active" : "topic-tab"}
                draggable
                title={topic}
                onMouseDown={(event) => {
                  event.stopPropagation();
                  props.onActivate();
                }}
                onDragStart={(event) => props.onTopicDragStart(event, topic)}
                onDragEnd={props.onTopicDragEnd}
                onClick={() => props.onTopic(topic)}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    props.onCloseTopic(topic);
                  }
                }}
              >
                <span>{topic}</span>
                {props.manualAvroSchemas[topic] && <span className="topic-tab-badge" title="Avro schema registered">Avro</span>}
                <X size={14} onClick={(event) => { event.stopPropagation(); props.onCloseTopic(topic); }} />
              </button>
            ))}
          </div>
          </div>
          <div className="tabs topic-work-tabs split-topic-tabs">
            {topicViews.map((view) => (
              <button key={view} className={props.pane.view === view ? "active" : ""} onClick={() => props.onView(view)} disabled={!props.pane.topic}>
                {view === "info" && <Layers size={15} />}
                {view === "consume" && <Play size={15} />}
                {view === "produce" && <Send size={15} />}
                {view === "info" ? "Info" : view === "consume" ? "Consume" : "Produce"}
              </button>
            ))}
            <button className="ghost schema-button refresh-side" onClick={props.onOpenSchema} disabled={!props.pane.topic}>
              <Braces size={15} /> Schema
            </button>
            <button className="ghost" onClick={props.onRefresh} disabled={!props.pane.topic}>
              <RefreshCw size={15} /> 새로고침
            </button>
          </div>
        </>
      )}

      <div className="content-grid split-content-grid">
        {props.pane.view === "brokers" && <BrokersPanel brokers={props.brokers} />}
        {props.pane.view === "topics" && (
          <ServerTopicsPanel
            topics={props.topics}
            favoriteTopicNames={props.favoriteTopicNames}
            selectedTopics={props.selectedTopics}
            sorting={props.topicSorting}
            onSortingChange={props.onTopicSortingChange}
            onOpen={props.onOpenTopic}
            onSelect={props.onTopic}
            onToggleSelected={props.onToggleTopicSelected}
            onToggleAllSelected={props.onToggleAllTopicsSelected}
            onCopySelected={props.onCopySelectedTopics}
            onPurgeSelected={props.onPurgeSelectedTopics}
            onDeleteSelected={props.onDeleteSelectedTopics}
            onToggleFavorite={props.onToggleTopicFavorite}
          />
        )}
        {props.pane.view === "consumers" && (
          <ConsumerGroupsPanel
            groups={props.groups}
            selectedGroupId={props.selectedGroupId}
            detail={props.selectedGroupLag}
            detailsByGroup={props.groupDetailsById}
            onSelectGroup={props.onSelectGroup}
            onBack={props.onBackGroup}
            onRefresh={props.onRefreshGroups}
            onRefreshDetail={props.onRefreshGroupDetail}
          />
        )}
        {props.pane.view === "info" && <TopicPanel detail={topicDetail} />}
        {props.pane.view === "consume" && (
          <ConsumePanel
            messages={props.consumeState.messages}
            topic={props.pane.topic}
            selectedMessage={props.consumeState.selectedMessage}
            mode={props.consumeState.mode}
            offsetOrder={props.consumeState.offsetOrder}
            isConsuming={props.isConsuming}
            offset={props.consumeState.offset}
            limit={props.consumeState.limit}
            partition={props.consumeState.partition}
            timeStart={props.consumeState.timeStart}
            timeEnd={props.consumeState.timeEnd}
            filterText={props.consumeState.filterText}
            filterField={props.consumeState.filterField}
            filterMode={props.consumeState.filterMode}
            inspectorCollapsed={props.consumeState.inspectorCollapsed}
            isQuerying={props.isQuerying}
            autoScroll={props.consumeState.autoScroll}
            maxMessages={props.consumeState.maxMessages}
            offsetPagination={props.consumeState.offsetPagination}
            messagePaneHeight={props.messagePaneHeight}
            onMode={(mode) => props.onUpdateConsume({
              mode,
              offsetPagination: null,
              ...(mode === "timeRange" ? getDefaultTimeRangeValues(props.consumeState) : {})
            })}
            onOffset={((offset) => props.onUpdateConsume({ offset, offsetPagination: null }))}
            onOffsetOrder={props.onOffsetOrder}
            onLimit={(limit) => props.onUpdateConsume({ limit, offsetPagination: null })}
            onPartition={(partition) => props.onUpdateConsume({ partition, offsetPagination: null })}
            onTimeStart={(timeStart) => props.onUpdateConsume({ timeStart })}
            onTimeEnd={(timeEnd) => props.onUpdateConsume({ timeEnd })}
            onFilterText={(filterText) => props.onUpdateConsume({ filterText })}
            onFilterField={(filterField) => props.onUpdateConsume({ filterField })}
            onFilterMode={(filterMode) => props.onUpdateConsume({ filterMode })}
            onInspectorCollapsed={(inspectorCollapsed) => props.onUpdateConsume({ inspectorCollapsed })}
            onClearFilter={() => props.onUpdateConsume({ filterText: "", filterField: "all", filterMode: "hide" })}
            onApplyFilter={(filterText) => props.onUpdateConsume({ filterText, filterField: "all" })}
            onAutoScroll={(autoScroll) => props.onUpdateConsume({ autoScroll })}
            onMaxMessages={(maxMessages) => props.onUpdateConsume({ maxMessages })}
            onPagePrev={() => props.onOffsetPage("prev")}
            onPageNext={() => props.onOffsetPage("next")}
            onSelectMessage={(selectedMessage) => props.onUpdateConsume({ selectedMessage })}
            onMessagePaneHeight={props.onMessagePaneHeight}
            onSendToProduce={props.onSendToProduce}
            onExport={props.onExport}
            onExportAll={props.onExportAll}
            onStart={props.onStartConsume}
            onStop={props.onStopConsume}
          />
        )}
        {props.pane.view === "produce" && (
          <ProducePanel
            topic={props.pane.topic}
            keyText={props.produceKey}
            headers={props.produceHeaders}
            value={props.produceValue}
            hasAvroSchema={Boolean(props.manualAvroSchemas[props.pane.topic])}
            avroEncoding={props.manualAvroSchemas[props.pane.topic]?.encoding}
            onKey={props.onProduceKey}
            onHeaders={props.onProduceHeaders}
            onValue={props.onProduceValue}
            onProduce={props.onProduce}
          />
        )}
      </div>
    </section>
  );
}
