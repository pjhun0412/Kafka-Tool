import React from "react";
import { CircleDot, Play, RefreshCw, Square } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import type { ConsumeFilterMode, ConsumeMode, OffsetOrder, TopicConsumeState } from "../../../uiTypes";
import { Button } from "../../ui";
import { ConsumeExportMenu } from "./ConsumeExportMenu";
import { ConsumePagingBar } from "./ConsumePagingBar";
import { DateTimePicker } from "./DateTimePicker";

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
  liveRecordEnabled: boolean;
  liveRecordPath: string;
  liveRecordCount: number;
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
  onLiveRecordEnabled: (value: boolean) => void;
  onPagePrev: () => void;
  onPageNext: () => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
  onStart: () => void;
  onStop: () => void;
};

export function ConsumeToolbar(props: ConsumeToolbarProps) {
  const language = useAppLanguage();
  const isStartingLive = props.mode === "live" && props.isQuerying && !props.isConsuming;
  const isStoppingLive = props.mode === "live" && props.isQuerying && props.isConsuming;
  return (
    <>
      <div className="toolbar">
        <div className="segmented">
          <button className={props.mode === "offset" ? "active" : ""} onClick={() => props.onMode("offset")} disabled={props.isConsuming}>Offset</button>
          <button className={props.mode === "timeRange" ? "active" : ""} onClick={() => props.onMode("timeRange")} disabled={props.isConsuming}>Time</button>
          <button className={props.mode === "live" ? "active" : ""} onClick={() => props.onMode("live")}>Live</button>
        </div>
        <input className="small-input" type="number" min={0} value={props.partition} onChange={(event) => props.onPartition(event.target.value)} placeholder={t(language, "placeholder.partition")} />
        {props.mode === "offset" && (
          <>
            <input className="small-input" type="number" min={0} value={props.offset} onChange={(event) => props.onOffset(event.target.value)} placeholder={t(language, "placeholder.offset")} />
            <input className="tiny-input" type="number" min={1} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title={t(language, "title.messageOrder")}>
              <option value="asc">{t(language, "label.oldest")}</option>
              <option value="desc">{t(language, "label.newest")}</option>
            </select>
          </>
        )}
        {props.mode === "timeRange" && (
          <>
            <DateTimePicker value={props.timeStart} label={t(language, "label.startTime")} onChange={props.onTimeStart} />
            <DateTimePicker value={props.timeEnd} label={t(language, "label.endTime")} onChange={props.onTimeEnd} />
            <input className="tiny-input" type="number" min={1} value={props.limit} onChange={(event) => props.onLimit(Number(event.target.value))} />
            <select className="order-select" value={props.offsetOrder} onChange={(event) => props.onOffsetOrder(event.target.value as OffsetOrder)} title={t(language, "title.messageOrder")}>
              <option value="asc">{t(language, "label.oldest")}</option>
              <option value="desc">{t(language, "label.newest")}</option>
            </select>
          </>
        )}
        {props.isConsuming ? (
          <Button variant="danger" onClick={props.onStop} disabled={props.isQuerying}>
            {isStoppingLive ? <RefreshCw size={16} className="spin" /> : <Square size={16} />}
            {isStoppingLive ? t(language, "label.stopping") : t(language, "label.pause")}
          </Button>
        ) : (
          <Button variant="primary" onClick={props.onStart} disabled={props.isQuerying}>
            {isStartingLive ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            {isStartingLive ? t(language, "label.starting") : props.mode === "live" ? t(language, "label.start") : "Consume"}
          </Button>
        )}
        {props.mode === "live" && (
          <label className="auto-scroll-toggle">
            <input type="checkbox" checked={props.autoScroll} onChange={(event) => props.onAutoScroll(event.target.checked)} />
            {t(language, "label.autoScroll")}
          </label>
        )}
        {props.mode === "live" && (
          <label className="auto-scroll-toggle" title={props.liveRecordPath || t(language, "title.liveRecord")}>
            <input
              type="checkbox"
              checked={props.liveRecordEnabled}
              onChange={(event) => props.onLiveRecordEnabled(event.target.checked)}
              disabled={props.isConsuming}
            />
            {t(language, "label.record")}
          </label>
        )}
        {props.mode === "live" && (
          <label className="max-messages-control">
            {t(language, "label.max")}
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
            {t(language, "label.streaming")}
          </span>
        )}
        {props.mode === "live" && props.liveRecordPath && (
          <span className="recording-badge" title={props.liveRecordPath}>
            <CircleDot size={13} />
            {t(language, "label.recording")} {props.liveRecordCount.toLocaleString()}
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
          {props.isConsuming ? "Live" : ""} {props.filterMode === "highlight" && props.hasActiveMessageFilter ? t(language, "label.highlighted", { count: String(props.filteredMessages.length) }) : props.filteredMessages.length}/{props.totalMessageCount} {t(language, "label.messages")}
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
