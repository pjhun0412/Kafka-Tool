import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, RefreshCw } from "lucide-react";
import type { ConsumedMessage, LiveMapPoint, MessageExportFormat } from "../../../../shared/types";
import type { AppLanguage } from "../../../i18n";
import { t } from "../../../i18n";
import { collectMessageValuePaths } from "../../../consumeValuePaths";
import { createLiveMapPoint } from "../../../mapPreview";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, MessageInspectorMode, MessagePayloadTarget, MessagePreviewEncoding, MessagePreviewMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { ConsumeToolbar } from "./ConsumeToolbar";
import { MessageInspector } from "./MessageInspector";
import { MessageFilterBar } from "./MessageFilterBar";
import { MessageGrid } from "./MessageGrid";
import { useConsumePanelMessages } from "./useConsumePanelMessages";
import { useInspectorResize } from "./useInspectorResize";

type ConsumePanelProps = {
  messages: ConsumedMessage[];
  topic: string;
  language: AppLanguage;
  selectedMessage: ConsumedMessage | null;
  mode: ConsumeMode;
  offsetOrder: OffsetOrder;
  isConsuming: boolean;
  offset: string;
  limit: number;
  partition: string;
  timeStart: string;
  timeEnd: string;
  filterText: string;
  filterField: ConsumeFilterField;
  filterMode: ConsumeFilterMode;
  inspectorMode: MessageInspectorMode;
  inspectorCollapsed: boolean;
  isQuerying: boolean;
  autoScroll: boolean;
  maxMessages: number;
  liveRecordEnabled: boolean;
  liveRecordPath: string;
  liveRecordCount: number;
  keyFormat: TopicConsumeState["keyFormat"];
  valueFormat: TopicConsumeState["valueFormat"];
  payloadEncoding: TopicConsumeState["payloadEncoding"];
  valueColumnPaths: string[];
  offsetPagination: TopicConsumeState["offsetPagination"];
  messagePaneHeight: number;
  onMode: (value: ConsumeMode) => void;
  onOffsetOrder: (value: OffsetOrder) => void;
  onOffset: (value: string) => void;
  onLimit: (value: number) => void;
  onPartition: (value: string) => void;
  onTimeStart: (value: string) => void;
  onTimeEnd: (value: string) => void;
  onFilterText: (value: string) => void;
  onFilterField: (value: ConsumeFilterField) => void;
  onFilterMode: (value: ConsumeFilterMode) => void;
  onInspectorMode: (value: MessageInspectorMode) => void;
  onInspectorCollapsed: (value: boolean) => void;
  onClearFilter: () => void;
  onApplyFilter: (value: string) => void;
  onAutoScroll: (value: boolean) => void;
  onMaxMessages: (value: number) => void;
  onLiveRecordEnabled: (value: boolean) => void;
  onKeyFormat: (value: TopicConsumeState["keyFormat"]) => void;
  onValueFormat: (value: TopicConsumeState["valueFormat"]) => void;
  onPayloadEncoding: (value: TopicConsumeState["payloadEncoding"]) => void;
  onValueColumnPaths: (value: string[]) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onSelectMessage: (message: ConsumedMessage) => void;
  onMessagePaneHeight: (value: number) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onStart: () => void;
  onStop: () => void;
};

const MAX_VALUE_COLUMN_CANDIDATES = 24;
const VALUE_COLUMN_SAMPLE_SIZE = 200;

function ConsumePanelView(props: ConsumePanelProps) {
  const [previewTarget, setPreviewTarget] = useState<MessagePayloadTarget>("value");
  const [previewMode, setPreviewMode] = useState<MessagePreviewMode>(props.valueFormat);
  const [previewEncoding, setPreviewEncoding] = useState<MessagePreviewEncoding>(props.payloadEncoding);
  const [inspectorSearch, setInspectorSearch] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState(props.filterText);
  const [isGridReady, setIsGridReady] = useState(false);
  const [showValueColumns, setShowValueColumns] = useState(false);
  const messageTableRef = useRef<HTMLDivElement | null>(null);
  const consumeGridRef = useRef<HTMLDivElement | null>(null);
  const lastSentLiveMapMessageRef = useRef("");
  const lastSentSelectedMapMessageRef = useRef("");
  const pendingLiveMapPointsRef = useRef<LiveMapPoint[]>([]);
  const liveMapFlushTimerRef = useRef<number | null>(null);
  const startInspectorResize = useInspectorResize({
    consumeGridRef,
    inspectorCollapsed: props.inspectorCollapsed,
    messagePaneHeight: props.messagePaneHeight,
    onMessagePaneHeight: props.onMessagePaneHeight
  });
  const {
    selectedPayload,
    selectedJson,
    filteredMessages,
    hasActiveMessageFilter,
    gridRows,
    highlightedMessageKeys,
    selectedMessageKey,
    isLargeOffsetRequest,
    pagination,
    canExportFullOffsetRange
  } = useConsumePanelMessages({
    messages: props.messages,
    selectedMessage: props.selectedMessage,
    mode: props.mode,
    limit: props.limit,
    filterText: props.filterText,
    filterField: props.filterField,
    filterMode: props.filterMode,
    offsetPagination: props.offsetPagination,
    keyFormat: props.keyFormat,
    valueFormat: props.valueFormat,
    payloadEncoding: props.payloadEncoding
  });

  const valueColumnCandidates = useMemo(() => {
    return collectMessageValuePaths(props.messages, VALUE_COLUMN_SAMPLE_SIZE, MAX_VALUE_COLUMN_CANDIDATES);
  }, [props.messages]);
  const visibleValueColumnPaths = useMemo(
    () => Array.from(new Set([...props.valueColumnPaths, ...valueColumnCandidates])),
    [props.valueColumnPaths, valueColumnCandidates]
  );

  useEffect(() => {
    setFilterDraft(props.filterText);
  }, [props.filterText]);

  useEffect(() => {
    setShowValueColumns(false);
  }, [props.topic]);

  useEffect(() => {
    setIsGridReady(false);
    const frame = window.requestAnimationFrame(() => setIsGridReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (filterDraft === props.filterText) return;
    const timer = window.setTimeout(() => {
      props.onFilterText(filterDraft);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [filterDraft, props.filterText, props.onFilterText]);

  useEffect(() => {
    if (props.mode !== "live" || !props.autoScroll) return;
    const scrollTarget = messageTableRef.current?.querySelector(".message-table");
    scrollTarget?.scrollTo({ top: 0 });
  }, [props.autoScroll, props.messages.length, props.mode]);

  useEffect(() => {
    if (props.mode !== "live" || props.messages.length === 0) return;
    const latestMessage = props.messages[0];
    const latestKey = `${latestMessage.topic}:${latestMessage.partition}:${latestMessage.offset}:${latestMessage.timestamp}`;
    if (latestKey === lastSentLiveMapMessageRef.current) return;
    lastSentLiveMapMessageRef.current = latestKey;
    const point = createLiveMapPoint(latestMessage);
    if (!point) return;
    pendingLiveMapPointsRef.current.push(point);
    if (liveMapFlushTimerRef.current !== null) return;
    liveMapFlushTimerRef.current = window.setTimeout(() => {
      liveMapFlushTimerRef.current = null;
      const points = pendingLiveMapPointsRef.current;
      pendingLiveMapPointsRef.current = [];
      if (points.length > 0) {
        void window.kafkaApi.sendLiveMapPoints(points);
      }
    }, 250);
  }, [props.messages, props.mode]);

  useEffect(() => {
    if (!props.selectedMessage) return;
    const selectedKey = `${props.selectedMessage.topic}:${props.selectedMessage.partition}:${props.selectedMessage.offset}:${props.selectedMessage.timestamp}`;
    if (selectedKey === lastSentSelectedMapMessageRef.current) return;
    lastSentSelectedMapMessageRef.current = selectedKey;
    const point = createLiveMapPoint(props.selectedMessage, selectedPayload) ?? createLiveMapPoint(props.selectedMessage);
    if (point) {
      void window.kafkaApi.sendLiveMapPoints([{ ...point, focus: true }]);
    }
  }, [props.selectedMessage, selectedPayload]);

  useEffect(() => {
    return () => {
      if (liveMapFlushTimerRef.current !== null) {
        window.clearTimeout(liveMapFlushTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (previewTarget === "key") setPreviewMode(props.keyFormat);
    if (previewTarget === "value") setPreviewMode(props.valueFormat);
  }, [previewTarget, props.keyFormat, props.valueFormat]);

  useEffect(() => {
    setPreviewEncoding(props.payloadEncoding);
  }, [props.payloadEncoding]);

  function clearMessageFilter() {
    setFilterDraft("");
    props.onClearFilter();
  }

  function selectMessage(message: ConsumedMessage) {
    if (props.selectedMessage === message) return;
    props.onSelectMessage(message);
    if (previewTarget === "key") {
      setPreviewMode(props.keyFormat);
    } else if (previewTarget === "value") {
      setPreviewMode(props.valueFormat);
    }
    setPreviewEncoding(props.payloadEncoding);
  }

  function toggleValueColumn(path: string) {
    props.onValueColumnPaths(props.valueColumnPaths.includes(path)
      ? props.valueColumnPaths.filter((item) => item !== path)
      : [...props.valueColumnPaths, path]);
  }

  const queryMessage = props.mode === "live"
    ? props.isConsuming
      ? t(props.language, "task.stoppingLiveConsume")
      : t(props.language, "task.startingLiveConsume")
    : props.mode === "timeRange"
      ? t(props.language, "task.loadingTimeRangeMessages")
      : t(props.language, "task.loadingMessages");

  return (
    <section className={props.isQuerying ? "panel consume-workspace querying" : "panel consume-workspace"}>
      {props.isQuerying && (
        <>
          <div className="consume-query-progress" aria-hidden="true" />
          <div className="pane-local-toast">
            <RefreshCw size={14} className="spin" />
            <span>{props.topic || "Topic"} {queryMessage}</span>
          </div>
        </>
      )}
      <ConsumeToolbar
        mode={props.mode}
        offsetOrder={props.offsetOrder}
        isConsuming={props.isConsuming}
        isQuerying={props.isQuerying}
        partition={props.partition}
        offset={props.offset}
        limit={props.limit}
        timeStart={props.timeStart}
        timeEnd={props.timeEnd}
        autoScroll={props.autoScroll}
        maxMessages={props.maxMessages}
        liveRecordEnabled={props.liveRecordEnabled}
        liveRecordPath={props.liveRecordPath}
        liveRecordCount={props.liveRecordCount}
        keyFormat={props.keyFormat}
        valueFormat={props.valueFormat}
        payloadEncoding={props.payloadEncoding}
        filterMode={props.filterMode}
        hasActiveMessageFilter={hasActiveMessageFilter}
        filteredMessages={filteredMessages}
        totalMessageCount={props.messages.length}
        isLargeOffsetRequest={isLargeOffsetRequest}
        pagination={pagination}
        canExportFullOffsetRange={canExportFullOffsetRange}
        isExportMenuOpen={isExportMenuOpen}
        onExportMenuOpen={setIsExportMenuOpen}
        onMode={props.onMode}
        onOffsetOrder={props.onOffsetOrder}
        onOffset={props.onOffset}
        onLimit={props.onLimit}
        onPartition={props.onPartition}
        onTimeStart={props.onTimeStart}
        onTimeEnd={props.onTimeEnd}
        onAutoScroll={props.onAutoScroll}
        onMaxMessages={props.onMaxMessages}
        onLiveRecordEnabled={props.onLiveRecordEnabled}
        onKeyFormat={props.onKeyFormat}
        onValueFormat={props.onValueFormat}
        onPayloadEncoding={props.onPayloadEncoding}
        onPagePrev={props.onPagePrev}
        onPageNext={props.onPageNext}
        onExport={props.onExport}
        onExportAll={props.onExportAll}
        onStart={props.onStart}
        onStop={props.onStop}
      />
      <MessageFilterBar
        filterDraft={filterDraft}
        filterField={props.filterField}
        filterMode={props.filterMode}
        onFilterDraft={setFilterDraft}
        onFilterField={props.onFilterField}
        onFilterMode={props.onFilterMode}
        onClear={clearMessageFilter}
      />
      {visibleValueColumnPaths.length > 0 && (
        <div className="value-column-bar">
          <button
            type="button"
            className={showValueColumns ? "filter-mode-toggle active" : "filter-mode-toggle"}
            onClick={() => setShowValueColumns((current) => !current)}
          >
            {t(props.language, "label.valueColumns")}
            {props.valueColumnPaths.length > 0 && <span>{props.valueColumnPaths.length}</span>}
          </button>
          {props.valueColumnPaths.length > 0 && (
            <button type="button" className="ghost compact" onClick={() => props.onValueColumnPaths([])}>
              {t(props.language, "label.clear")}
            </button>
          )}
          {showValueColumns && (
            <div className="value-column-picker">
              {visibleValueColumnPaths.map((path) => (
                <label key={path}>
                  <input
                    type="checkbox"
                    checked={props.valueColumnPaths.includes(path)}
                    onChange={() => toggleValueColumn(path)}
                  />
                  <span>{path}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
      <div
        className={props.inspectorCollapsed ? "consume-grid inspector-collapsed" : "consume-grid"}
        ref={consumeGridRef}
        style={{ gridTemplateRows: props.inspectorCollapsed ? "minmax(0, 1fr) 34px" : `${props.messagePaneHeight}px 8px minmax(0, 1fr)` }}
      >
        <div ref={messageTableRef} className="consume-grid-table-wrap">
          {isGridReady ? (
            <MessageGrid
              rows={gridRows}
              valueColumnPaths={props.valueColumnPaths}
              selectedMessageKey={selectedMessageKey}
              filterMode={props.filterMode}
              hasActiveMessageFilter={hasActiveMessageFilter}
              highlightedMessageKeys={highlightedMessageKeys}
              onSelectMessage={selectMessage}
            />
          ) : (
            <div className="message-table tanstack-message-table table-warmup">
              <div className="empty-list">Loading messages...</div>
            </div>
          )}
        </div>
        {props.inspectorCollapsed ? (
          <button className="message-inspector-collapsed" onClick={() => props.onInspectorCollapsed(false)}>
            <ChevronUp size={15} />
            Message Viewer
            <span>{props.selectedMessage ? `${props.selectedMessage.topic}@${props.selectedMessage.offset}` : "No message selected"}</span>
          </button>
        ) : (
          <>
            <div className="consume-split-resizer" onPointerDown={startInspectorResize} title={t(props.language, "title.resizeMessageViewerPanels")} />
            <MessageInspector
              mode={props.inspectorMode}
              previewTarget={previewTarget}
              previewMode={previewMode}
              valueFormat={props.valueFormat}
              previewEncoding={previewEncoding}
              search={inspectorSearch}
              payload={selectedPayload}
              rawText={selectedJson}
              valueText={props.selectedMessage?.value ?? ""}
              selectedMessage={props.selectedMessage}
              onMode={props.onInspectorMode}
              onPreviewTarget={setPreviewTarget}
              onPreviewMode={setPreviewMode}
              onPreviewEncoding={setPreviewEncoding}
              onSearch={setInspectorSearch}
              onApplyFilter={props.onApplyFilter}
              onSendToProduce={props.onSendToProduce}
              onCollapse={() => props.onInspectorCollapsed(true)}
            />
          </>
        )}
      </div>
    </section>
  );
}

function areConsumePanelPropsEqual(previous: ConsumePanelProps, next: ConsumePanelProps) {
  return previous.messages === next.messages
    && previous.topic === next.topic
    && previous.language === next.language
    && previous.selectedMessage === next.selectedMessage
    && previous.mode === next.mode
    && previous.offsetOrder === next.offsetOrder
    && previous.isConsuming === next.isConsuming
    && previous.offset === next.offset
    && previous.limit === next.limit
    && previous.partition === next.partition
    && previous.timeStart === next.timeStart
    && previous.timeEnd === next.timeEnd
    && previous.filterText === next.filterText
    && previous.filterField === next.filterField
    && previous.filterMode === next.filterMode
    && previous.inspectorMode === next.inspectorMode
    && previous.inspectorCollapsed === next.inspectorCollapsed
    && previous.isQuerying === next.isQuerying
    && previous.autoScroll === next.autoScroll
    && previous.maxMessages === next.maxMessages
    && previous.liveRecordEnabled === next.liveRecordEnabled
    && previous.liveRecordPath === next.liveRecordPath
    && previous.liveRecordCount === next.liveRecordCount
    && previous.keyFormat === next.keyFormat
    && previous.valueFormat === next.valueFormat
    && previous.payloadEncoding === next.payloadEncoding
    && previous.valueColumnPaths === next.valueColumnPaths
    && previous.offsetPagination === next.offsetPagination
    && previous.messagePaneHeight === next.messagePaneHeight;
}

export const ConsumePanel = React.memo(ConsumePanelView, areConsumePanelPropsEqual);
