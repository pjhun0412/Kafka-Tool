import React from "react";
import { EyeOff, HelpCircle, Sparkles } from "lucide-react";
import type { ConsumeFilterField, ConsumeFilterMode } from "../../../uiTypes";
import { Button, IconButton } from "../../ui";

type MessageFilterBarProps = {
  filterDraft: string;
  filterField: ConsumeFilterField;
  filterMode: ConsumeFilterMode;
  onFilterDraft: (value: string) => void;
  onFilterField: (value: ConsumeFilterField) => void;
  onFilterMode: (value: ConsumeFilterMode) => void;
  onClear: () => void;
};

export function MessageFilterBar(props: MessageFilterBarProps) {
  return (
    <div className="filter-bar">
      <select value={props.filterField} onChange={(event) => props.onFilterField(event.target.value as ConsumeFilterField)}>
        <option value="all">All</option>
        <option value="key">Key</option>
        <option value="value">Value</option>
        <option value="headers">Headers</option>
        <option value="headersEmpty">Empty Headers</option>
        <option value="offset">Offset</option>
        <option value="partition">Partition</option>
        <option value="timestamp">Timestamp</option>
      </select>
      <div className="filter-input-wrap">
        <input value={props.filterDraft} onChange={(event) => props.onFilterDraft(event.target.value)} placeholder="Filter messages" />
      </div>
      <div className="filter-help">
        <IconButton variant="subtle" aria-label="Filter help">
          <HelpCircle size={15} />
        </IconButton>
        <div className="filter-help-popover" role="tooltip">
          <strong>Filter syntax</strong>
          <div className="filter-help-content">
            <span className="filter-help-row"><b>Text</b><code>PR1001 key:PR1001 value:OK</code></span>
            <span className="filter-help-row"><b>JSON path</b><code>value.proc_id == "PR0116"</code></span>
            <span className="filter-help-row"><b>Compare</b><code>decoded.speed &gt;= 80</code></span>
            <span className="filter-help-row"><b>Exists</b><code>headers.traceId exists</code></span>
            <span className="filter-help-row"><b>Exclude</b><code>!error -timeout</code></span>
            <span className="filter-help-row"><b>Regex</b><code>/timeout|failed/i</code></span>
            <span className="filter-help-row"><b>Empty</b><code>empty:headers empty:key empty:value</code></span>
            <span className="filter-help-row"><b>Phrase</b><code>value:"process status"</code></span>
            <span className="filter-help-note">Fields: key, value, headers, partition, offset, timestamp, topic, decoded</span>
          </div>
        </div>
      </div>
      <Button
        variant={props.filterMode === "highlight" ? "secondary" : "ghost"}
        className="filter-mode-toggle"
        active={props.filterMode === "highlight"}
        onClick={() => props.onFilterMode(props.filterMode === "hide" ? "highlight" : "hide")}
        title={props.filterMode === "hide" ? "Hide unmatched rows" : "Highlight matched rows"}
      >
        {props.filterMode === "hide" ? <EyeOff size={14} /> : <Sparkles size={14} />}
        {props.filterMode === "hide" ? "Hide" : "Highlight"}
      </Button>
      <Button variant="ghost" size="sm" onClick={props.onClear}>Clear</Button>
    </div>
  );
}
