import React from "react";
import { Calendar, ChevronDown, Download, Play, Square } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import type { ConsumeFilterMode, ConsumeMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { OFFSET_PAGE_SIZE } from "../../../consumeConfig";
import { Button } from "../../ui";

type ConsumeToolbarProps = {
  mode: ConsumeMode;
  offsetOrder: OffsetOrder;
  isConsuming: boolean;
  isQuerying: boolean;
  partition: string;
  offset: string;
  limit: number;
  timeStart: string;
  timeEnd: string;
  autoScroll: boolean;
  maxMessages: number;
  filterMode: ConsumeFilterMode;
  hasActiveMessageFilter: boolean;
  filteredMessages: ConsumedMessage[];
  totalMessageCount: number;
  isLargeOffsetRequest: boolean;
  pagination: TopicConsumeState["offsetPagination"];
  canExportFullOffsetRange: boolean;
  isExportMenuOpen: boolean;
  onExportMenuOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  onMode: (value: ConsumeMode) => void;
  onOffsetOrder: (value: OffsetOrder) => void;
  onOffset: (value: string) => void;
  onLimit: (value: number) => void;
  onPartition: (value: string) => void;
  onTimeStart: (value: string) => void;
  onTimeEnd: (value: string) => void;
  onAutoScroll: (value: boolean) => void;
  onMaxMessages: (value: number) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onStart: () => void;
  onStop: () => void;
};

export function ConsumeToolbar(props: ConsumeToolbarProps) {
  return (
    <>
      <div className="toolbar">
        <div className="segmented">
          <button className={props.mode === "offset" ? "active" : ""} onClick={() => props.onMode("offset")} disabled={props.isConsuming}>Offset</button>
          <button className={props.mode === "timeRange" ? "active" : ""} onClick={() => props.onMode("timeRange")} disabled={props.isConsuming}>Time</button>
          <button className={props.mode === "live" ? "active" : ""} onClick={() => props.onMode("live")}>Live</button>
        </div>
        <input className="small-input" type="number" min={0} value={props.partition} onChange={(event) => props.onPartition(event.target.value)} placeholder="partition" />
        {props.mode === "offset" && (
          <>
            <input className="small-input" type="number" min={0} value={props.offset} onChange={(event) => props.onOffset(event.target.value)} placeholder="offset" />
            <input className="tiny-input" type="number" min={1} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title="Message order">
              <option value="asc">Oldest</option>
              <option value="desc">Newest</option>
            </select>
          </>
        )}
        {props.mode === "timeRange" && (
          <>
            <label className="date-field">
              <Calendar size={14} />
              <input type="datetime-local" value={props.timeStart} onChange={(event) => props.onTimeStart(event.target.value)} />
            </label>
            <label className="date-field">
              <Calendar size={14} />
              <input type="datetime-local" value={props.timeEnd} onChange={(event) => props.onTimeEnd(event.target.value)} />
            </label>
            <input className="tiny-input" type="number" min={1} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title="Message order">
              <option value="asc">Oldest</option>
              <option value="desc">Newest</option>
            </select>
          </>
        )}
        {props.isConsuming ? (
          <Button variant="danger" onClick={props.onStop}><Square size={16} /> Pause</Button>
        ) : (
          <Button variant="primary" onClick={props.onStart}><Play size={16} /> {props.mode === "live" ? "Start" : "Consume"}</Button>
        )}
        {props.mode === "live" && (
          <label className="auto-scroll-toggle">
            <input type="checkbox" checked={props.autoScroll} onChange={(event) => props.onAutoScroll(event.target.checked)} />
            Auto Scroll
          </label>
        )}
        {props.mode === "live" && (
          <label className="max-messages-control">
            Max
            <select value={props.maxMessages} onChange={(event) => props.onMaxMessages(Number(event.target.value))}>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
              <option value={10000}>10,000</option>
            </select>
          </label>
        )}
        {props.mode === "live" && (
          <span className={props.isConsuming ? "streaming-badge active" : "streaming-badge"}>
            <span />
            Streaming
          </span>
        )}
        <div className="export-menu">
          <Button
            variant="subtle"
            className="export-button"
            onClick={() => props.onExportMenuOpen((current) => !current)}
            disabled={props.filteredMessages.length === 0}
            title="Export filtered messages"
          >
            <Download size={14} />
            <ChevronDown size={13} />
          </Button>
          {props.isExportMenuOpen && (
            <div className="export-menu-popover">
              <span className="export-menu-label">Current page</span>
              {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => {
                    props.onExportMenuOpen(false);
                    props.onExport(format, props.filteredMessages);
                  }}
                >
                  <Download size={13} />
                  {format.toUpperCase()}
                </button>
              ))}
              {props.canExportFullOffsetRange && (
                <>
                  <span className="export-menu-divider" />
                  <span className="export-menu-label">Full offset range</span>
                  {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
                    <button
                      key={`all-${format}`}
                      onClick={() => {
                        props.onExportMenuOpen(false);
                        props.onExportAll(format);
                      }}
                    >
                      <Download size={13} />
                      All {format.toUpperCase()}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <span className={props.isConsuming ? "count live-count" : "count"}>
          {props.isConsuming ? "Live" : ""} {props.filterMode === "highlight" && props.hasActiveMessageFilter ? `${props.filteredMessages.length} highlighted` : props.filteredMessages.length}/{props.totalMessageCount} messages
        </span>
      </div>
      {props.isLargeOffsetRequest && (
        <div className="paging-bar">
          <span>
            Page {props.pagination ? props.pagination.pageIndex + 1 : 1}
            {" "}of {Math.max(1, Math.ceil(props.limit / OFFSET_PAGE_SIZE))}
            {" "}· showing up to {OFFSET_PAGE_SIZE.toLocaleString()} messages
          </span>
          <div>
            <Button variant="ghost" size="sm" onClick={props.onPagePrev} disabled={props.isQuerying || !props.pagination || props.pagination.prevOffsets.length === 0}>Prev</Button>
            <Button variant="ghost" size="sm" onClick={props.onPageNext} disabled={props.isQuerying || !props.pagination?.hasNext}>Next</Button>
          </div>
        </div>
      )}
    </>
  );
}
