import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronUp, RefreshCw } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import { DataGrid } from "../../DataGrid";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { filterMessages } from "../../../messageFilters";
import { formatHeaders, formatMessagePayload, formatTimestamp, previewHeaders, previewValue } from "../../../utils";
import { ConsumeToolbar } from "./ConsumeToolbar";
import { JsonInspector } from "./JsonInspector";
import { MessageFilterBar } from "./MessageFilterBar";
const OFFSET_PAGING_THRESHOLD = 10000;
const OFFSET_PAGE_SIZE = 5000;
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
  const highlightedMessageKeys = useMemo(
    () => new Set(filteredMessages.map((message) => `${message.partition}-${message.offset}-${message.timestamp}`)),
    [filteredMessages]
  );
  const gridMessages = props.filterMode === "highlight" && hasActiveMessageFilter ? props.messages : filteredMessages;
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
    messageTableRef.current?.scrollTo({ top: 0 });
  }, [props.autoScroll, props.messages.length, props.mode]);

  function clearMessageFilter() {
    setFilterDraft("");
    props.onClearFilter();
  }

  function startInspectorResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = props.messagePaneHeight;
    const gridHeight = consumeGridRef.current?.getBoundingClientRect().height ?? 620;
    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(150, gridHeight - 250);
      const nextHeight = Math.min(maxHeight, Math.max(120, startHeight + moveEvent.clientY - startY));
      props.onMessagePaneHeight(nextHeight);
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function getRowNo(index: number) {
    return index + 1;
  }

  const columns = useMemo<ColumnDef<ConsumedMessage>[]>(() => [
    {
      id: "no",
      header: "No",
      enableSorting: false,
      cell: ({ row }) => getRowNo(row.index)
    },
    {
      accessorKey: "partition",
      header: "Partition",
      sortingFn: "basic",
      cell: ({ row }) => {
        const partition = row.original.partition;
        return (
          <span className="partition-badge">
            {partition}
          </span>
        );
      }
    },
    {
      accessorKey: "offset",
      header: "Offset",
      sortingFn: (left, right, columnId) => Number(left.getValue(columnId)) - Number(right.getValue(columnId)),
      cell: ({ row }) => <span title={row.original.offset}>{row.original.offset}</span>
    },
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      sortingFn: (left, right, columnId) => Date.parse(String(left.getValue(columnId))) - Date.parse(String(right.getValue(columnId))),
      cell: ({ row }) => <span title={row.original.timestamp}>{formatTimestamp(row.original.timestamp)}</span>
    },
    {
      accessorKey: "key",
      header: "Key",
      cell: ({ row }) => <span title={row.original.key || "-"}>{row.original.key || "-"}</span>
    },
    {
      id: "headers",
      header: "Headers",
      accessorFn: (message) => formatHeaders(message.headers),
      cell: ({ row }) => <span title={formatHeaders(row.original.headers)}>{previewHeaders(row.original.headers)}</span>
    },
    {
      id: "value",
      header: "Value",
      accessorFn: (message) => message.decoded?.value !== undefined ? JSON.stringify(message.decoded.value) : message.value,
      cell: ({ row }) => {
        const decoded = row.original.decoded;
        const hasDecodedValue = decoded?.value !== undefined;
        const displayValue = hasDecodedValue ? JSON.stringify(decoded.value) : row.original.value;
        return (
          <span title={decoded?.error ?? displayValue}>
            {hasDecodedValue && <span className="decode-badge">Avro</span>}
            {decoded?.error && <span className="decode-badge error">Avro error</span>}
            {previewValue(displayValue)}
          </span>
        );
      }
    }
  ], []);

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
            <DataGrid
              data={gridMessages}
              columns={columns}
              className="tanstack-message-table"
              emptyText="No messages"
              getRowKey={(message) => `${message.partition}-${message.offset}-${message.timestamp}`}
              getRowClassName={(message) => {
                const classes = [];
                if (props.selectedMessage === message) classes.push("selected");
                if (props.filterMode === "highlight" && hasActiveMessageFilter) {
                  const isMatched = highlightedMessageKeys.has(`${message.partition}-${message.offset}-${message.timestamp}`);
                  classes.push(isMatched ? "filter-highlight" : "filter-muted");
                }
                return classes.join(" ");
              }}
              onRowClick={props.onSelectMessage}
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
