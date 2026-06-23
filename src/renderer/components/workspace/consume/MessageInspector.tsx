import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Copy, Filter, MapPin, Send } from "lucide-react";
import type { ConsumedMessage } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { createLiveMapPoint } from "../../../mapPreview";
import { formatMessagePayload } from "../../../messagePreview";
import type { MessageInspectorMode, MessagePayloadFormat, MessagePayloadTarget, MessagePreviewEncoding, MessagePreviewMode } from "../../../uiTypes";
import { getEpochTitle, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";

export function MessageInspector(props: {
  mode: MessageInspectorMode;
  previewTarget: MessagePayloadTarget;
  previewMode: MessagePreviewMode;
  valueFormat: MessagePayloadFormat;
  previewEncoding: MessagePreviewEncoding;
  search: string;
  payload: unknown;
  rawText: string;
  valueText: string;
  selectedMessage: ConsumedMessage | null;
  onMode: (mode: MessageInspectorMode) => void;
  onPreviewTarget: (target: MessagePayloadTarget) => void;
  onPreviewMode: (mode: MessagePreviewMode) => void;
  onPreviewEncoding: (encoding: MessagePreviewEncoding) => void;
  onSearch: (value: string) => void;
  onApplyFilter: (value: string) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onCollapse: () => void;
}) {
  const language = useAppLanguage();
  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }
  const previewText = formatMessagePayload(
    props.selectedMessage,
    props.previewTarget,
    props.previewMode,
    props.previewEncoding,
    props.previewMode === "json"
  );
  const valueCopyText = formatMessagePayload(
    props.selectedMessage,
    "value",
    props.valueFormat,
    props.previewEncoding,
    props.valueFormat === "json"
  );
  const mapPoint = useMemo(
    () => (props.selectedMessage ? createLiveMapPoint(props.selectedMessage, props.payload) ?? createLiveMapPoint(props.selectedMessage) : null),
    [props.payload, props.selectedMessage]
  );
  const canShowTree = Boolean(props.payload);
  const showEncoding = props.mode === "preview" && props.previewMode === "text" && (props.previewTarget === "key" || props.previewTarget === "value");

  async function openLiveMap() {
    const focusedPoint = mapPoint ? { ...mapPoint, focus: true } : null;
    if (focusedPoint) {
      await window.kafkaApi.sendLiveMapPoints([focusedPoint]);
    }
    await window.kafkaApi.openLiveMap();
  }

  return (
    <section className="message-inspector">
      <div className="message-inspector-toolbar">
        <div className="segmented compact-segmented">
          <button className={props.mode === "raw" ? "active" : ""} onClick={() => props.onMode("raw")}>{t(language, "label.raw")}</button>
          <button className={props.mode === "tree" ? "active" : ""} onClick={() => props.onMode("tree")}>{t(language, "label.tree")}</button>
          <button className={props.mode === "preview" ? "active" : ""} onClick={() => props.onMode("preview")}>{t(language, "label.preview")}</button>
        </div>
        <div className="message-inspector-options">
          {props.mode === "preview" && (
            <>
              <select
                className="preview-mode-select preview-target-select"
                value={props.previewTarget}
                onChange={(event) => props.onPreviewTarget(event.target.value as MessagePayloadTarget)}
                aria-label={t(language, "label.previewTarget")}
              >
                <option value="value">{t(language, "label.value")}</option>
                <option value="key">{t(language, "label.key")}</option>
                <option value="headers">{t(language, "label.headers")}</option>
                <option value="message">{t(language, "label.message")}</option>
              </select>
              <select
                className="preview-mode-select"
                value={props.previewMode}
                onChange={(event) => props.onPreviewMode(event.target.value as MessagePreviewMode)}
                aria-label={t(language, "label.previewMode")}
              >
                <option value="text">{t(language, "label.previewText")}</option>
                <option value="json">{t(language, "label.previewJson")}</option>
                <option value="hex">{t(language, "label.previewHex")}</option>
                <option value="base64">{t(language, "label.previewBase64")}</option>
                <option value="metadata">{t(language, "label.previewMetadata")}</option>
              </select>
            </>
          )}
          {showEncoding && (
            <select
              className="preview-mode-select preview-encoding-select"
              value={props.previewEncoding}
              onChange={(event) => props.onPreviewEncoding(event.target.value as MessagePreviewEncoding)}
              aria-label={t(language, "label.previewEncoding")}
            >
              <option value="utf-8">UTF-8</option>
              <option value="euc-kr">EUC-KR</option>
            </select>
          )}
        </div>
        <input className="message-inspector-search" value={props.search} onChange={(event) => props.onSearch(event.target.value)} placeholder={t(language, "placeholder.searchPayload")} />
        <div className="message-inspector-actions">
          <button className="ghost compact" onClick={() => void copyText(props.rawText)} disabled={!props.rawText}><Copy size={14} /> JSON</button>
          <button className="ghost compact" onClick={() => void copyText(valueCopyText)} disabled={!valueCopyText}><Copy size={14} /> {t(language, "label.value")}</button>
          {props.mode === "preview" && (
            <button className="ghost compact" onClick={() => void copyText(previewText)} disabled={!previewText}><Copy size={14} /> {t(language, "label.preview")}</button>
          )}
          <button
            className="ghost compact"
            onClick={() => void openLiveMap()}
            disabled={!mapPoint}
            title={mapPoint ? t(language, "title.openLiveMap") : t(language, "label.noMapCoordinate")}
          >
            <MapPin size={14} /> Map
          </button>
          <button className="ghost compact" onClick={() => props.selectedMessage && props.onSendToProduce(props.selectedMessage)} disabled={!props.selectedMessage}><Send size={14} /> Produce</button>
          <button className="ghost compact icon-only" onClick={props.onCollapse} title={t(language, "title.collapseMessageViewer")} aria-label={t(language, "title.collapseMessageViewer")}><ChevronDown size={15} /></button>
        </div>
      </div>
      {props.selectedMessage ? (
        props.mode === "tree" ? (
          canShowTree ? (
            <div className="message-tree">
              <MessageTreeNode name="message" value={props.payload} path="message" search={props.search} onApplyFilter={props.onApplyFilter} />
            </div>
          ) : (
            <pre className="message-view">{t(language, "label.noStructuredPayload")}</pre>
          )
        ) : props.mode === "preview" ? (
          <pre className={props.previewMode === "hex" ? "message-view message-preview hex-preview" : "message-view message-preview"}>
            {renderHighlightedText(previewText || t(language, "label.emptyPayload"), props.search)}
          </pre>
        ) : (
          <pre className="message-view">{renderRawJsonText(props.rawText, props.search)}</pre>
        )
      ) : (
        <pre className="message-view">{t(language, "label.selectMessageToInspect")}</pre>
      )}
    </section>
  );
}

export function MessageTreeNode(props: {
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
      <div className="message-tree-node leaf">
        <span className="message-tree-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="message-tree-separator">:</span>
        <span className="message-tree-value" title={epochTitle}>{renderHighlightedText(primitive, props.search)}</span>
        <button className="message-tree-filter" onClick={() => props.onApplyFilter(primitive)} title={t(language, "title.applyToFilter")}>
          <Filter size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="message-tree-node">
      <button className="message-tree-node-toggle" onClick={() => setExpanded((current) => !current)}>
        {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <span className="message-tree-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="message-tree-meta">{Array.isArray(props.value) ? `[${entries.length}]` : `{${entries.length}}`}</span>
      </button>
      {expanded && (
        <div className="message-tree-children">
          {entries.map(([key, value]) => (
            <MessageTreeNode key={`${props.path}.${key}`} name={key} value={value} path={`${props.path}.${key}`} search={props.search} onApplyFilter={props.onApplyFilter} />
          ))}
        </div>
      )}
    </div>
  );
}
