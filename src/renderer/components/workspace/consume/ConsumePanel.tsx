import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronUp, RefreshCw } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { filterMessages } from "../../../messageFilters";
import { formatMessagePayload } from "../../../utils";
import { OFFSET_PAGE_SIZE, OFFSET_PAGING_THRESHOLD } from "../../../consumeConfig";
import { ConsumeToolbar } from "./ConsumeToolbar";
import { JsonInspector } from "./JsonInspector";
import { MessageFilterBar } from "./MessageFilterBar";
import { MessageGrid, useMessageGridRows } from "./MessageGrid";

export function ConsumePanel(props: {
  messages: ConsumedMessage[];
  topic: string;
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
  const selectedPayload = useMemo(
    () => (props.selectedMessage ? formatMessagePayload(props.selectedMessage) : null),
    [props.selectedMessage]
  );
  const selectedJson = useMemo(
    () => (selectedPayload ? JSON.stringify(selectedPayload, null, 2) : ""),
    [selectedPayload]
  );
  const filteredMessages = useMemo(
    () => filterMessages(props.messages, props.filterText, props.filterField),
    [props.filterField, props.filterText, props.messages]
  );
  const hasActiveMessageFilter = props.filterText.trim().length > 0 || props.filterField === "headersEmpty";
  const {
    rows: gridRows,
    highlightedMessageKeys,
    selectedMessageKey
  } = useMessageGridRows({
    messages: props.messages,
    filteredMessages,
    filterMode: props.filterMode,
    hasActiveMessageFilter,
    selectedMessage: props.selectedMessage
  });
  const isLargeOffsetRequest = props.mode === "offset" && props.limit > OFFSET_PAGING_THRESHOLD;
  const pagination = props.offsetPagination;
  const canExportFullOffsetRange = isLargeOffsetRequest && Boolean(pagination?.endOffsetExclusive);

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

  function startInspectorResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const gridElement = consumeGridRef.current;
    if (!gridElement) return;
    const resizeHandle = event.currentTarget;
    resizeHandle.setPointerCapture(event.pointerId);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    const startY = event.clientY;
    const startHeight = props.messagePaneHeight;
    const gridHeight = gridElement.getBoundingClientRect().height;
    let nextHeight = startHeight;
    let animationFrame = 0;
    const applyHeight = () => {
      gridElement.style.gridTemplateRows = `${nextHeight}px 8px minmax(0, 1fr)`;
      animationFrame = 0;
    };
    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(150, gridHeight - 250);
      nextHeight = Math.min(maxHeight, Math.max(120, startHeight + moveEvent.clientY - startY));
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(applyHeight);
      }
    };
    const cleanup = (pointerId: number) => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (resizeHandle.hasPointerCapture(pointerId)) {
        resizeHandle.releasePointerCapture(pointerId);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
    const onPointerUp = (upEvent: PointerEvent) => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        applyHeight();
      }
      props.onMessagePaneHeight(nextHeight);
      cleanup(upEvent.pointerId);
    };
    const onPointerCancel = (cancelEvent: PointerEvent) => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      gridElement.style.gridTemplateRows = props.inspectorCollapsed ? "minmax(0, 1fr) 34px" : `${props.messagePaneHeight}px 8px minmax(0, 1fr)`;
      cleanup(cancelEvent.pointerId);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  }

  return (
    <section className={props.isQuerying ? "panel consume-workspace querying" : "panel consume-workspace"}>
      {props.isQuerying && (
        <div className="pane-local-toast">
          <RefreshCw size={14} className="spin" />
          <span>{props.topic || "Topic"} 조회 중</span>
        </div>
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
            <div className="consume-split-resizer" onPointerDown={startInspectorResize} title="Resize message grid and JSON viewer" />
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
