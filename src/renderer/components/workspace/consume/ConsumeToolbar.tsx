import React from "react";
import { Calendar, Play, Square } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import type { ConsumeFilterMode, ConsumeMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { Button } from "../../ui";
import { ConsumeExportMenu } from "./ConsumeExportMenu";
import { ConsumePagingBar } from "./ConsumePagingBar";

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
        <ConsumeExportMenu
          filteredMessages={props.filteredMessages}
          canExportFullOffsetRange={props.canExportFullOffsetRange}
          isExportMenuOpen={props.isExportMenuOpen}
          onExportMenuOpen={props.onExportMenuOpen}
          onExport={props.onExport}
          onExportAll={props.onExportAll}
        />
        <span className={props.isConsuming ? "count live-count" : "count"}>
          {props.isConsuming ? "Live" : ""} {props.filterMode === "highlight" && props.hasActiveMessageFilter ? `${props.filteredMessages.length} highlighted` : props.filteredMessages.length}/{props.totalMessageCount} messages
        </span>
      </div>
      {props.isLargeOffsetRequest && (
        <ConsumePagingBar
          isQuerying={props.isQuerying}
          limit={props.limit}
          pagination={props.pagination}
          onPagePrev={props.onPagePrev}
          onPageNext={props.onPageNext}
        />
      )}
    </>
  );
}
