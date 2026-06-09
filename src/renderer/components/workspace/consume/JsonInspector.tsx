import React, { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Filter, Send } from "lucide-react";
import type { ConsumedMessage } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import type { JsonInspectorMode } from "../../../uiTypes";
import { getEpochTitle, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";

export function JsonInspector(props: {
  mode: JsonInspectorMode;
  search: string;
  payload: unknown;
  rawText: string;
  valueText: string;
  selectedMessage: ConsumedMessage | null;
  onMode: (mode: JsonInspectorMode) => void;
  onSearch: (value: string) => void;
  onApplyFilter: (value: string) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onCollapse: () => void;
}) {
  const language = useAppLanguage();
  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  return (
    <section className="json-inspector">
      <div className="json-toolbar">
        <div className="segmented compact-segmented">
          <button className={props.mode === "raw" ? "active" : ""} onClick={() => props.onMode("raw")}>{t(language, "label.raw")}</button>
          <button className={props.mode === "tree" ? "active" : ""} onClick={() => props.onMode("tree")}>{t(language, "label.tree")}</button>
        </div>
        <input value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder={t(language, "placeholder.searchJson")} />
        <button className="ghost compact" onClick={() => void copyText(props.rawText)} disabled={!props.rawText}><Copy size={14} /> JSON</button>
        <button className="ghost compact" onClick={() => void copyText(props.valueText)} disabled={!props.valueText}><Copy size={14} /> Value</button>
        <button className="ghost compact" onClick={() => props.selectedMessage && props.onSendToProduce(props.selectedMessage)} disabled={!props.selectedMessage}><Send size={14} /> Produce</button>
        <button className="ghost compact icon-only" onClick={props.onCollapse} title={t(language, "title.collapseJsonViewer")} aria-label={t(language, "title.collapseJsonViewer")}><ChevronDown size={15} /></button>
      </div>
      {props.payload ? (
        props.mode === "raw" ? (
          <pre className="json-view">{renderRawJsonText(props.rawText, props.search)}</pre>
        ) : (
          <div className="json-tree">
            <JsonTreeNode name="message" value={props.payload} path="message" search={props.search} onApplyFilter={props.onApplyFilter} />
          </div>
        )
      ) : (
        <pre className="json-view">{t(language, "label.selectMessageJson")}</pre>
      )}
    </section>
  );
}

export function JsonTreeNode(props: {
  name: string;
  value: unknown;
  path: string;
  search: string;
  onApplyFilter: (value: string) => void;
}) {
  const language = useAppLanguage();
  const [expanded, setExpanded] = useState(true);
  const isObject = props.value !== null && typeof props.value === "object";
  const entries = isObject ? Object.entries(props.value as Record<string, unknown>) : [];
  const primitive = stringifyPrimitive(props.value);
  const epochTitle = getEpochTitle(props.value);

  if (!isObject) {
    return (
      <div className="json-node leaf">
        <span className="json-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="json-separator">:</span>
        <span className="json-value" title={epochTitle}>{renderHighlightedText(primitive, props.search)}</span>
        <button className="json-filter" onClick={() => props.onApplyFilter(primitive)} title={t(language, "title.applyToFilter")}>
          <Filter size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="json-node">
      <button className="json-node-toggle" onClick={() => setExpanded((current) => !current)}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="json-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="json-meta">{Array.isArray(props.value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
      </button>
      {expanded && (
        <div className="json-children">
          {entries.map(([key, value]) => (
            <JsonTreeNode key={`${props.path}.${key}`} name={key} value={value} path={`${props.path}.${key}`} search={props.search} onApplyFilter={props.onApplyFilter} />
          ))}
        </div>
      )}
    </div>
  );
}
