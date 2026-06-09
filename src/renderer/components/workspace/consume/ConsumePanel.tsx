import React, { useEffect, useRef, useState } from "react";
import { ChevronUp, RefreshCw } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import type { AppLanguage } from "../../../i18n";
import { t } from "../../../i18n";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { ConsumeToolbar } from "./ConsumeToolbar";
import { JsonInspector } from "./JsonInspector";
import { MessageFilterBar } from "./MessageFilterBar";
import { MessageGrid } from "./MessageGrid";
import { useConsumePanelMessages } from "./useConsumePanelMessages";
import { useInspectorResize } from "./useInspectorResize";

export function ConsumePanel(props: {
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
  inspectorCollapsed: boolean;
  isQuerying: boolean;
  autoScroll: boolean;
  maxMessages: number;
  liveRecordEnabled: boolean;
  liveRecordPath: string;
  liveRecordCount: number;
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
  onInspectorCollapsed: (value: boolean) => void;
  onClearFilter: () => void;
  onApplyFilter: (value: string) => void;
  onAutoScroll: (value: boolean) => void;
  onMaxMessages: (value: number) => void;
  onLiveRecordEnabled: (value: boolean) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onSelectMessage: (message: ConsumedMessage) => void;
  onMessagePaneHeight: (value: number) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onStart: () => void;
  onStop: () => void;
}) {
  const [inspectorMode, setInspectorMode] = useState<JsonInspectorMode>("raw");
  const [inspectorSearch, setInspectorSearch] = useState("");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [filterDraft, setFilterDraft] = useState(props.filterText);
  const [isGridReady, setIsGridReady] = useState(false);
  const messageTableRef = useRef<HTMLDivElement | null>(null);
  const consumeGridRef = useRef<HTMLDivElement | null>(null);
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
    offsetPagination: props.offsetPagination
  });

  useEffect(() => {
    setFilterDraft(props.filterText);
  }, [props.filterText]);

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

  function clearMessageFilter() {
    setFilterDraft("");
    props.onClearFilter();
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
      <div
        className={props.inspectorCollapsed ? "consume-grid inspector-collapsed" : "consume-grid"}
        ref={consumeGridRef}
        style={{ gridTemplateRows: props.inspectorCollapsed ? "minmax(0, 1fr) 34px" : `${props.messagePaneHeight}px 8px minmax(0, 1fr)` }}
      >
        <div ref={messageTableRef} className="consume-grid-table-wrap">
          {isGridReady ? (
            <MessageGrid
              rows={gridRows}
              selectedMessageKey={selectedMessageKey}
              filterMode={props.filterMode}
              hasActiveMessageFilter={hasActiveMessageFilter}
              highlightedMessageKeys={highlightedMessageKeys}
              onSelectMessage={props.onSelectMessage}
            />
          ) : (
            <div className="message-table tanstack-message-table table-warmup">
              <div className="empty-list">Loading messages...</div>
            </div>
          )}
        </div>
        {props.inspectorCollapsed ? (
          <button className="json-inspector-collapsed" onClick={() => props.onInspectorCollapsed(false)}>
            <ChevronUp size={15} />
            JSON Viewer
            <span>{props.selectedMessage ? `${props.selectedMessage.topic}@${props.selectedMessage.offset}` : "No message selected"}</span>
          </button>
        ) : (
          <>
            <div className="consume-split-resizer" onPointerDown={startInspectorResize} title={t(props.language, "title.resizeMessageJsonPanels")} />
            <JsonInspector
              mode={inspectorMode}
              search={inspectorSearch}
              payload={selectedPayload}
              rawText={selectedJson}
              valueText={props.selectedMessage?.value ?? ""}
              selectedMessage={props.selectedMessage}
              onMode={setInspectorMode}
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
