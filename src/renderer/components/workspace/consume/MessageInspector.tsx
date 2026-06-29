import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Columns3, Copy, Filter, MapPin, Search, Send, Settings2, X } from "lucide-react";
import type { ConsumedMessage } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { createLiveMapPoint, getMapCoordinateFromSelection, normalizeMapFieldMapping } from "../../../mapPreview";
import type { MapFieldMapping } from "../../../mapPreview";
import { formatMessagePayload } from "../../../messagePreview";
import { collectValuePaths } from "../../../consumeValuePaths";
import type { MessageInspectorMode, MessagePayloadFormat, MessagePayloadTarget, MessagePreviewEncoding, MessagePreviewMode } from "../../../uiTypes";
import { getEpochTitle, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";

type MapFieldPickerId = "x" | "y" | "identity" | "heading" | "speed";

function getPathSegments(path: string) {
  return path.split(".").filter(Boolean);
}

function formatMapFieldPath(path: string) {
  if (!path) return "";
  const segments = getPathSegments(path);
  const leaf = segments.at(-1) ?? path;
  const parent = segments.at(-2) ?? "";
  return parent ? `${leaf} (...${parent})` : leaf;
}

function getAutoMapFieldPath(paths: string[], kind: MapFieldPickerId) {
  const patterns: Record<MapFieldPickerId, RegExp[]> = {
    x: [/longitude$/i, /lng$/i, /lon$/i, /xM$/],
    y: [/latitude$/i, /lat$/i, /yM$/],
    identity: [/vehicleID$/i, /vehicleId$/i, /terminalID$/i, /terminalId$/i],
    heading: [/heading$/i, /bearing$/i, /direction$/i],
    speed: [/egoVehicleSpeedMps$/i, /speedMps$/i, /speed$/i]
  };
  return paths.find((path) => patterns[kind].some((pattern) => pattern.test(path))) ?? "";
}

function getValueColumnPathFromTreePath(path: string) {
  const valuePrefix = "message.value.";
  if (!path.startsWith(valuePrefix)) return null;
  const valuePath = path.slice(valuePrefix.length);
  return valuePath ? valuePath : null;
}

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
  mapFieldMapping: MapFieldMapping | null;
  valueColumnPaths: string[];
  onMode: (mode: MessageInspectorMode) => void;
  onPreviewTarget: (target: MessagePayloadTarget) => void;
  onPreviewMode: (mode: MessagePreviewMode) => void;
  onPreviewEncoding: (encoding: MessagePreviewEncoding) => void;
  onSearch: (value: string) => void;
  onApplyFilter: (value: string) => void;
  onSendToProduce: (message: ConsumedMessage) => void;
  onMapFieldMapping: (mapping: MapFieldMapping | null) => void;
  onValueColumnPath: (path: string) => void;
  onCollapse: () => void;
}) {
  const language = useAppLanguage();
  const [isMapSettingsOpen, setIsMapSettingsOpen] = useState(false);
  const [activeMapFieldPicker, setActiveMapFieldPicker] = useState<MapFieldPickerId | null>(null);
  const [mapFieldPickerQuery, setMapFieldPickerQuery] = useState("");
  const [mapSettingsNotice, setMapSettingsNotice] = useState("");
  const [mapSettingsDraft, setMapSettingsDraft] = useState<MapFieldMapping>({
    xPath: "",
    yPath: "",
    projection: "wgs84"
  });
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
    () => (props.selectedMessage ? createLiveMapPoint(props.selectedMessage, props.payload, undefined, props.mapFieldMapping) ?? createLiveMapPoint(props.selectedMessage) : null),
    [props.mapFieldMapping, props.payload, props.selectedMessage]
  );
  const mapFieldPaths = useMemo(() => Array.from(collectValuePaths(props.payload)).sort((left, right) => left.localeCompare(right)), [props.payload]);
  const autoMapFieldPaths = useMemo(() => ({
    x: getAutoMapFieldPath(mapFieldPaths, "x"),
    y: getAutoMapFieldPath(mapFieldPaths, "y"),
    identity: getAutoMapFieldPath(mapFieldPaths, "identity"),
    heading: getAutoMapFieldPath(mapFieldPaths, "heading"),
    speed: getAutoMapFieldPath(mapFieldPaths, "speed")
  }), [mapFieldPaths]);
  const canShowTree = Boolean(props.payload);
  const showEncoding = props.mode === "preview" && props.previewMode === "text" && (props.previewTarget === "key" || props.previewTarget === "value");

  useEffect(() => {
    function copySelectedInspectorText(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "c" || (!event.metaKey && !event.ctrlKey) || event.altKey) return;
      const selection = window.getSelection();
      const selectedText = selection?.toString() ?? "";
      if (!selection || selection.isCollapsed || !selectedText) return;
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      const anchorElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      const focusElement = focusNode instanceof Element ? focusNode : focusNode?.parentElement;
      const isInspectorSelection = Boolean(
        anchorElement?.closest(".message-inspector")
        || focusElement?.closest(".message-inspector")
      );
      if (!isInspectorSelection) return;
      event.preventDefault();
      void navigator.clipboard.writeText(selectedText);
    }

    window.addEventListener("keydown", copySelectedInspectorText, true);
    return () => window.removeEventListener("keydown", copySelectedInspectorText, true);
  }, []);

  async function openLiveMap() {
    if (!props.selectedMessage) return;
    if (!mapPoint) {
      openMapSettings(t(language, "label.mapFieldMappingRequired"));
      return;
    }
    const focusedPoint = mapPoint ? { ...mapPoint, focus: true } : null;
    if (focusedPoint) {
      await window.kafkaApi.sendLiveMapPoints([focusedPoint]);
    }
    await window.kafkaApi.openLiveMap();
  }

  function openMapSettings(notice = "") {
    setMapSettingsDraft(props.mapFieldMapping ?? {
      xPath: "",
      yPath: "",
      projection: "wgs84"
    });
    setActiveMapFieldPicker(null);
    setMapFieldPickerQuery("");
    setMapSettingsNotice(notice);
    setIsMapSettingsOpen(true);
  }

  function updateMapSettingsDraft(patch: Partial<MapFieldMapping>) {
    setMapSettingsDraft((current) => ({ ...current, ...patch }));
  }

  function applyMapSettings() {
    const normalized = normalizeMapFieldMapping(mapSettingsDraft);
    if (!normalized || !getMapCoordinateFromSelection(props.payload, normalized)) {
      setMapSettingsNotice(t(language, "label.mapFieldMappingInvalid"));
      return;
    }
    props.onMapFieldMapping(normalized);
    setMapSettingsNotice("");
    setIsMapSettingsOpen(false);
  }

  function clearMapSettings() {
    props.onMapFieldMapping(null);
    setMapSettingsDraft({ xPath: "", yPath: "", projection: "wgs84" });
  }

  function closeFieldPicker() {
    setActiveMapFieldPicker(null);
    setMapFieldPickerQuery("");
  }

  function openFieldPicker(id: MapFieldPickerId) {
    setActiveMapFieldPicker((current) => current === id ? null : id);
    setMapFieldPickerQuery("");
  }

  function getMapFieldPickerPaths(value: string) {
    const query = mapFieldPickerQuery.trim().toLowerCase();
    const filtered = query
      ? mapFieldPaths.filter((path) => path.toLowerCase().includes(query) || formatMapFieldPath(path).toLowerCase().includes(query))
      : mapFieldPaths;
    return Array.from(new Set([value, ...filtered].filter(Boolean))).sort((left, right) => formatMapFieldPath(left).localeCompare(formatMapFieldPath(right)));
  }

  function selectMapField(value: string, onChange: (value: string) => void) {
    onChange(value);
    closeFieldPicker();
  }

  function renderMapFieldPicker(params: {
    id: MapFieldPickerId;
    value: string;
    autoPath?: string;
    required?: boolean;
    placement?: "top" | "bottom";
    onChange: (value: string) => void;
  }) {
    const isOpen = activeMapFieldPicker === params.id;
    const display = params.value
      ? formatMapFieldPath(params.value)
      : params.required
        ? t(language, "label.selectField")
        : params.autoPath
          ? `${t(language, "label.autoDetect")} (${formatMapFieldPath(params.autoPath)})`
          : t(language, "label.autoDetectFailed");
    const paths = getMapFieldPickerPaths(params.value);
    return (
      <div className="map-field-picker">
        <button
          type="button"
          className={params.value ? "map-field-picker-trigger selected" : "map-field-picker-trigger"}
          onClick={() => openFieldPicker(params.id)}
          title={params.value || params.autoPath || display}
        >
          <span>{display}</span>
          <ChevronDown size={14} />
        </button>
        {isOpen && (
          <div className={params.placement === "top" ? "map-field-picker-popover open-up" : "map-field-picker-popover"}>
            <label className="map-field-picker-search">
              <Search size={13} />
              <input
                value={mapFieldPickerQuery}
                onChange={(event) => setMapFieldPickerQuery(event.target.value)}
                placeholder={t(language, "placeholder.searchMapFields")}
                autoFocus
              />
            </label>
            {!params.required && (
              <button
                type="button"
                className="map-field-picker-option muted"
                title={params.autoPath || ""}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectMapField("", params.onChange);
                }}
              >
                <span>{params.autoPath ? `${t(language, "label.autoDetect")} (${formatMapFieldPath(params.autoPath)})` : t(language, "label.autoDetectFailed")}</span>
              </button>
            )}
            <div className="map-field-picker-list">
              {paths.map((path) => (
                <button
                  type="button"
                  className={path === params.value ? "map-field-picker-option selected" : "map-field-picker-option"}
                  key={path}
                  title={path}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    selectMapField(path, params.onChange);
                  }}
                >
                  <strong>{formatMapFieldPath(path)}</strong>
                  <span>{path}</span>
                </button>
              ))}
              {paths.length === 0 && <div className="map-field-picker-empty">{t(language, "label.noSettingsMatched")}</div>}
            </div>
          </div>
        )}
      </div>
    );
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
            disabled={!props.selectedMessage}
            title={mapPoint ? t(language, "title.openLiveMap") : t(language, "label.mapFieldMappingRequired")}
          >
            <MapPin size={14} /> Map
          </button>
          <button
            className={props.mapFieldMapping ? "ghost compact active" : "ghost compact"}
            onClick={() => openMapSettings()}
            disabled={!props.selectedMessage}
            title={t(language, "title.mapFieldSettings")}
          >
            <Settings2 size={14} /> {t(language, "label.mapSettings")}
          </button>
          <button className="ghost compact" onClick={() => props.selectedMessage && props.onSendToProduce(props.selectedMessage)} disabled={!props.selectedMessage}><Send size={14} /> Produce</button>
          <button className="ghost compact icon-only" onClick={props.onCollapse} title={t(language, "title.collapseMessageViewer")} aria-label={t(language, "title.collapseMessageViewer")}><ChevronDown size={15} /></button>
        </div>
      </div>
      {isMapSettingsOpen && (
        <div className="modal-backdrop map-field-modal-backdrop" role="presentation" onMouseDown={() => setIsMapSettingsOpen(false)}>
          <section className="map-field-modal" role="dialog" aria-modal="true" aria-labelledby="map-field-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-title">
              <div>
                <span className="eyebrow">{props.selectedMessage?.topic ?? "Topic"}</span>
                <h2 id="map-field-modal-title">{t(language, "label.mapFieldMapping")}</h2>
              </div>
              <button className="modal-close" onClick={() => setIsMapSettingsOpen(false)} title={t(language, "title.close")}>
                <X size={16} />
              </button>
            </div>
            <p className="map-field-modal-help">{t(language, "label.mapFieldMappingHelp")}</p>
            {mapSettingsNotice && <div className="map-field-modal-notice" role="alert">{mapSettingsNotice}</div>}
            <div className={activeMapFieldPicker ? "map-field-modal-grid picker-open" : "map-field-modal-grid"}>
              <div className="map-field-section">
                <strong>{t(language, "label.mapCoordinateSection")}</strong>
              </div>
              <label>
                <span>{t(language, "label.mapCoordinateSystem")}</span>
                <select value={mapSettingsDraft.projection} onChange={(event) => {
                  closeFieldPicker();
                  updateMapSettingsDraft({ projection: event.target.value as MapFieldMapping["projection"] });
                }}>
                  <optgroup label={t(language, "label.mapProjectionWgs84Group")}>
                    <option value="wgs84">WGS84 (Lat/Lng Deg)</option>
                    <option value="wgs84_msec">WGS84 (Lat/Lng Msec)</option>
                  </optgroup>
                  <optgroup label={t(language, "label.mapProjectionTmGroup")}>
                    <option value="korea_grs80_central">GRS80 (Korea Central Belt / 한국 중부원점)</option>
                    <option value="korea_itrf2000_central">ITRF 2000 (Central Belt / 한국 중부원점)</option>
                  </optgroup>
                  <optgroup label={t(language, "label.mapProjectionUtmGroup")}>
                    <option value="utm52n">UTM Zone 52N (Korea Belt)</option>
                  </optgroup>
                </select>
              </label>
              <div className="map-field-section">
                <strong>{t(language, "label.mapRequiredCoordinateSection")}</strong>
              </div>
              <label>
                <span>{t(language, "label.mapYField")}</span>
                {renderMapFieldPicker({ id: "y", value: mapSettingsDraft.yPath, required: true, autoPath: autoMapFieldPaths.y, onChange: (yPath) => updateMapSettingsDraft({ yPath }) })}
              </label>
              <label>
                <span>{t(language, "label.mapXField")}</span>
                {renderMapFieldPicker({ id: "x", value: mapSettingsDraft.xPath, required: true, autoPath: autoMapFieldPaths.x, onChange: (xPath) => updateMapSettingsDraft({ xPath }) })}
              </label>
              <div className="map-field-section">
                <strong>{t(language, "label.mapVehicleSection")}</strong>
              </div>
              <label>
                <span>{t(language, "label.mapHeadingField")}</span>
                {renderMapFieldPicker({ id: "heading", value: mapSettingsDraft.headingPath ?? "", autoPath: autoMapFieldPaths.heading, placement: "top", onChange: (headingPath) => updateMapSettingsDraft({ headingPath }) })}
              </label>
              <div className="map-field-row">
                <label>
                  <span>{t(language, "label.mapSpeedField")}</span>
                  {renderMapFieldPicker({ id: "speed", value: mapSettingsDraft.speedPath ?? "", autoPath: autoMapFieldPaths.speed, placement: "top", onChange: (speedPath) => updateMapSettingsDraft({ speedPath }) })}
                </label>
                <label>
                  <span>{t(language, "label.mapSpeedUnit")}</span>
                  <select
                  value={mapSettingsDraft.speedUnit ?? "auto"}
                  onChange={(event) => {
                    closeFieldPicker();
                    updateMapSettingsDraft({ speedUnit: event.target.value as MapFieldMapping["speedUnit"] });
                  }}
                >
                    <option value="auto">{t(language, "label.autoDetect")}</option>
                    <option value="kmh">km/h</option>
                    <option value="mps">m/s</option>
                  </select>
                </label>
              </div>
              <label>
                <span>{t(language, "label.mapIdentityField")}</span>
                {renderMapFieldPicker({ id: "identity", value: mapSettingsDraft.identityPath ?? "", autoPath: autoMapFieldPaths.identity, placement: "top", onChange: (identityPath) => updateMapSettingsDraft({ identityPath }) })}
              </label>
            </div>
            <div className="modal-actions">
              <button className="ghost compact" onClick={clearMapSettings}>{t(language, "label.clear")}</button>
              <button className="ghost compact" onClick={() => setIsMapSettingsOpen(false)}>{t(language, "action.cancel")}</button>
              <button className="primary compact" onClick={applyMapSettings} disabled={!mapSettingsDraft.xPath || !mapSettingsDraft.yPath}>{t(language, "action.save")}</button>
            </div>
          </section>
        </div>
      )}
      {props.selectedMessage ? (
        props.mode === "tree" ? (
          canShowTree ? (
            <div className="message-tree">
              <MessageTreeNode
                name="message"
                value={props.payload}
                path="message"
                search={props.search}
                valueColumnPaths={props.valueColumnPaths}
                onApplyFilter={props.onApplyFilter}
                onValueColumnPath={props.onValueColumnPath}
              />
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
  valueColumnPaths: string[];
  onApplyFilter: (value: string) => void;
  onValueColumnPath: (path: string) => void;
}) {
  const language = useAppLanguage();
  const [expanded, setExpanded] = useState(true);
  const isObject = props.value !== null && typeof props.value === "object";
  const entries = isObject ? Object.entries(props.value as Record<string, unknown>) : [];
  const primitive = stringifyPrimitive(props.value);
  const epochTitle = getEpochTitle(props.value);

  if (!isObject) {
    const valueColumnPath = getValueColumnPathFromTreePath(props.path);
    const isValueColumnSelected = Boolean(valueColumnPath && props.valueColumnPaths.includes(valueColumnPath));
    return (
      <div className="message-tree-node leaf">
        <span className="message-tree-key">{renderHighlightedText(props.name, props.search)}</span>
        <span className="message-tree-separator">:</span>
        <span className="message-tree-value" title={epochTitle}>{renderHighlightedText(primitive, props.search)}</span>
        <button className="message-tree-filter" onClick={() => props.onApplyFilter(primitive)} title={t(language, "title.applyToFilter")}>
          <Filter size={12} />
        </button>
        {valueColumnPath && (
          <button
            className={isValueColumnSelected ? "message-tree-column selected" : "message-tree-column"}
            onClick={() => props.onValueColumnPath(valueColumnPath)}
            title={isValueColumnSelected ? t(language, "title.valueColumnAlreadyAdded") : t(language, "title.addValueColumn")}
            aria-label={isValueColumnSelected ? t(language, "title.valueColumnAlreadyAdded") : t(language, "title.addValueColumn")}
          >
            <Columns3 size={12} />
          </button>
        )}
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
            <MessageTreeNode
              key={`${props.path}.${key}`}
              name={key}
              value={value}
              path={`${props.path}.${key}`}
              search={props.search}
              valueColumnPaths={props.valueColumnPaths}
              onApplyFilter={props.onApplyFilter}
              onValueColumnPath={props.onValueColumnPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
