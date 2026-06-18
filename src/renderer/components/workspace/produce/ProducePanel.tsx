import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { Braces, Eye, Play, Save, Send, Square, Trash2 } from "lucide-react";
import type { ManualAvroSchema, ProduceTemplatePreference } from "../../../../shared/types";
import type { ProduceDraftOverride } from "../../../hooks/actions/useProduceActions";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import {
  formatProduceElapsed,
  getProduceTemplateExamples,
  parseProduceDurationMs,
  renderProduceTemplateDraft,
  validateProduceTemplateDraft,
  type ProduceTemplateDraft,
  type ProduceTemplateIssue
} from "../../../produceTemplate";
import { parseProduceHeaders, validateJsonLikeValue } from "../../../utils";

type ProduceIntervalRequest = {
  draft: ProduceTemplateDraft;
  stopMode: "count" | "duration";
  intervalMs: number;
  count: number;
  durationText: string;
};

type ProduceIntervalConfig = ProduceTemplatePreference["intervalConfig"];

export function ProducePanel(props: {
  topic: string;
  keyText: string;
  headers: string;
  value: string;
  templates: ProduceTemplatePreference[];
  hasAvroSchema: boolean;
  avroEncoding?: ManualAvroSchema["encoding"];
  onKey: (value: string) => void;
  onHeaders: (value: string) => void;
  onValue: (value: string) => void;
  onTemplates: (templates: ProduceTemplatePreference[]) => void;
  onProduce: () => void;
  onProduceDraft: (draft: ProduceDraftOverride) => Promise<void>;
  intervalConfig: ProduceIntervalConfig;
  intervalState: {
    error: string;
    isRunning: boolean;
    sentCount: number;
    startedAt: number;
  };
  onIntervalConfig: Dispatch<SetStateAction<ProduceIntervalConfig>>;
  onStartInterval: (request: ProduceIntervalRequest) => Promise<void>;
  onStopInterval: () => void;
}) {
  const language = useAppLanguage();
  const [intervalError, setIntervalError] = useState("");
  const [isConfirmingInterval, setIsConfirmingInterval] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateMessage, setTemplateMessage] = useState("");
  const [pendingDeleteTemplateId, setPendingDeleteTemplateId] = useState("");
  const [isRenderedPreviewOpen, setIsRenderedPreviewOpen] = useState(false);
  const { durationText, intervalMs, mode, stopMode, totalCount } = props.intervalConfig;

  const draft = useMemo<ProduceTemplateDraft>(() => ({
    key: props.keyText,
    headers: props.headers,
    value: props.value
  }), [props.headers, props.keyText, props.value]);
  const sortedTemplates = useMemo(
    () => [...props.templates].sort((left, right) => right.updatedAt - left.updatedAt),
    [props.templates]
  );
  const intervalPlan = useMemo(() => {
    const delay = Math.max(100, Math.floor(intervalMs || 100));
    const count = Math.max(1, Math.min(100000, Math.floor(totalCount || 1)));
    const durationMs = parseProduceDurationMs(durationText);
    const estimatedMax = stopMode === "count" ? count : durationMs > 0 ? Math.ceil(durationMs / delay) : 0;
    return { count, delay, durationMs, estimatedMax };
  }, [durationText, intervalMs, stopMode, totalCount]);
  const valueIssue = useMemo(() => {
    const valueToValidate = mode === "interval" ? renderProduceTemplateDraft(draft, 1).value : props.value;
    return getJsonValueIssue(valueToValidate);
  }, [draft, mode, props.value]);
  const renderedPreview = useMemo(
    () => renderProduceTemplateDraft(draft, 1),
    [draft]
  );
  const templateIssues = useMemo(() => validateProduceTemplateDraft(draft), [draft]);

  useEffect(() => {
    setIsConfirmingInterval(false);
  }, [mode, props.topic]);

  useEffect(() => {
    if (!selectedTemplateId) return;
    if (sortedTemplates.some((template) => template.id === selectedTemplateId)) return;
    setSelectedTemplateId("");
    setTemplateName("");
  }, [selectedTemplateId, sortedTemplates]);

  useEffect(() => {
    if (!templateMessage) return;
    const timer = window.setTimeout(() => setTemplateMessage(""), 1800);
    return () => window.clearTimeout(timer);
  }, [templateMessage]);

  useEffect(() => {
    if (!pendingDeleteTemplateId) return;
    const timer = window.setTimeout(() => setPendingDeleteTemplateId(""), 3200);
    return () => window.clearTimeout(timer);
  }, [pendingDeleteTemplateId]);

  useEffect(() => {
    setIsRenderedPreviewOpen(false);
  }, [props.topic]);

  function updateIntervalConfig(patch: Partial<ProduceIntervalConfig>) {
    props.onIntervalConfig((current) => ({ ...current, ...patch }));
  }

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId);
    const template = sortedTemplates.find((item) => item.id === templateId);
    if (!template) {
      setTemplateName("");
      return;
    }
    props.onKey(template.draft.key);
    props.onHeaders(template.draft.headers);
    props.onValue(template.draft.value);
    props.onIntervalConfig(template.intervalConfig);
    setTemplateName(template.name);
    setTemplateMessage(t(language, "produceTemplate.loaded", { name: template.name }));
  }

  function saveCurrentTemplate() {
    const name = templateName.trim();
    if (!props.topic) {
      setTemplateMessage(t(language, "label.topicRequired"));
      return;
    }
    if (!name) {
      setTemplateMessage(t(language, "produceTemplate.nameRequired"));
      return;
    }
    const now = Date.now();
    const selectedTemplate = selectedTemplateId
      ? sortedTemplates.find((item) => item.id === selectedTemplateId)
      : undefined;
    const duplicateTemplate = sortedTemplates.find((item) => item.name.trim().toLowerCase() === name.toLowerCase());
    const existingId = selectedTemplate?.id ?? duplicateTemplate?.id ?? "";
    const nextTemplate: ProduceTemplatePreference = {
      id: existingId || createTemplateId(),
      name,
      draft,
      intervalConfig: props.intervalConfig,
      updatedAt: now
    };
    const withoutCurrent = props.templates.filter((item) => item.id !== nextTemplate.id);
    props.onTemplates([...withoutCurrent, nextTemplate].sort((left, right) => right.updatedAt - left.updatedAt));
    setSelectedTemplateId(nextTemplate.id);
    setPendingDeleteTemplateId("");
    setTemplateMessage(t(language, existingId ? "produceTemplate.updated" : "produceTemplate.saved", { name }));
  }

  function deleteSelectedTemplate() {
    if (!selectedTemplateId) return;
    const selected = sortedTemplates.find((item) => item.id === selectedTemplateId);
    if (!selected) return;
    if (pendingDeleteTemplateId !== selectedTemplateId) {
      setPendingDeleteTemplateId(selectedTemplateId);
      setTemplateMessage(t(language, "produceTemplate.deleteConfirm", { name: selected.name }));
      return;
    }
    props.onTemplates(props.templates.filter((item) => item.id !== selectedTemplateId));
    setSelectedTemplateId("");
    setTemplateName("");
    setPendingDeleteTemplateId("");
    setTemplateMessage(t(language, "produceTemplate.deleted", { name: selected.name }));
  }

  async function startIntervalProduce() {
    if (intervalMs < 100) {
      setIntervalError("Every must be at least 100ms.");
      return;
    }
    if (stopMode === "duration" && intervalPlan.durationMs <= 0) {
      setIntervalError("Duration must be like 30s, 5m, 1h, or 1m30s.");
      return;
    }
    if (templateIssues.length > 0) {
      setIntervalError(formatTemplateIssue(templateIssues[0], language));
      return;
    }
    setIsConfirmingInterval(false);
    setIntervalError("");
    await props.onStartInterval({
      count: intervalPlan.count,
      draft,
      durationText,
      intervalMs: intervalPlan.delay,
      stopMode
    });
  }

  function requestIntervalStart() {
    if (intervalMs < 100) {
      setIntervalError("Every must be at least 100ms.");
      return;
    }
    if (stopMode === "duration" && intervalPlan.durationMs <= 0) {
      setIntervalError("Duration must be like 30s, 5m, 1h, or 1m30s.");
      return;
    }
    if (templateIssues.length > 0) {
      setIntervalError(formatTemplateIssue(templateIssues[0], language));
      return;
    }
    if (valueIssue) {
      setIntervalError(`${valueIssue.message} Check the first rendered message. String tokens like \${date:yyyy-MM-dd HH:mm:ss} must be wrapped in quotes inside JSON.`);
      return;
    }
    const renderedDraft = renderProduceTemplateDraft(draft, 1);
    const headers = parseProduceHeaders(renderedDraft.headers);
    if (typeof headers === "string") {
      setIntervalError(headers);
      return;
    }
    setIntervalError("");
    setIsConfirmingInterval(true);
  }

  return (
    <section className="panel produce-panel">
      <div className="section-title">
        <h2>{t(language, "label.produce")}</h2>
        <span>{props.topic || t(language, "label.topicRequired")}</span>
      </div>
      <div className="produce-mode-row">
        <div className="segmented-control">
          <button className={mode === "single" ? "active" : ""} type="button" onClick={() => updateIntervalConfig({ mode: "single" })}>{t(language, "label.single")}</button>
          <button className={mode === "interval" ? "active" : ""} type="button" onClick={() => updateIntervalConfig({ mode: "interval" })}>{t(language, "label.interval")}</button>
        </div>
        {mode === "interval" && (
          <div className="produce-interval-controls">
            <label>
              {t(language, "label.every")}
              <input
                type="number"
                min={100}
                step={100}
                value={intervalMs}
                onChange={(event) => updateIntervalConfig({ intervalMs: Number(event.target.value) })}
              />
              ms
            </label>
            <label>
              {t(language, "label.stopBy")}
              <select value={stopMode} onChange={(event) => updateIntervalConfig({ stopMode: event.target.value as "count" | "duration" })}>
                <option value="count">{t(language, "label.count")}</option>
                <option value="duration">{t(language, "label.duration")}</option>
              </select>
            </label>
            {stopMode === "count" ? (
            <label>
              {t(language, "label.count")}
              <input
                type="number"
                min={1}
                max={100000}
                value={totalCount}
                onChange={(event) => updateIntervalConfig({ totalCount: Number(event.target.value) })}
              />
            </label>
            ) : (
              <label>
                {t(language, "label.duration")}
                <input
                  type="text"
                  value={durationText}
                  onChange={(event) => updateIntervalConfig({ durationText: event.target.value })}
                  placeholder="5m"
                />
              </label>
            )}
            {props.intervalState.isRunning && (
              <span className="produce-interval-status">
                {props.intervalState.sentCount}{stopMode === "count" ? `/${totalCount}` : ""}
              </span>
            )}
          </div>
        )}
        <div className="produce-template-toolbar">
          <span className="produce-template-toolbar-label">{t(language, "produceTemplate.template")}</span>
          <select value={selectedTemplateId} onChange={(event) => applyTemplate(event.target.value)} aria-label={t(language, "produceTemplate.select")}>
            <option value="">{t(language, "produceTemplate.select")}</option>
            {sortedTemplates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
          <input
            value={templateName}
            onChange={(event) => setTemplateName(event.target.value)}
            placeholder={t(language, "produceTemplate.namePlaceholder")}
          />
          <button type="button" className="ghost compact icon-only" onClick={saveCurrentTemplate} title={t(language, "produceTemplate.save")}>
            <Save size={13} />
          </button>
          <button
            type="button"
            className="ghost compact icon-only danger-text"
            onClick={deleteSelectedTemplate}
            disabled={!selectedTemplateId}
            title={pendingDeleteTemplateId === selectedTemplateId ? t(language, "produceTemplate.deleteConfirmShort") : t(language, "produceTemplate.delete")}
          >
            <Trash2 size={13} />
          </button>
          {templateMessage && <span className="produce-template-message">{templateMessage}</span>}
        </div>
      </div>
      {props.hasAvroSchema && (
        <div className="produce-schema-notice">
          <Braces size={15} />
          {t(language, "label.avroSerializationEnabled")} ({props.avroEncoding === "confluent" ? "Confluent" : "Raw"})
        </div>
      )}
      <label>{t(language, "label.key")}<input value={props.keyText} onChange={(event) => props.onKey(event.target.value)} placeholder={t(language, "placeholder.optionalKey")} /></label>
      <label>{t(language, "label.headers")}<textarea className="headers-editor" value={props.headers} onChange={(event) => props.onHeaders(event.target.value)} placeholder="{ }" /></label>
      <label>
        <span className="produce-value-label-row">
          <span>{t(language, "label.value")}</span>
          <span className="produce-value-actions">
            <button
              type="button"
              className={isRenderedPreviewOpen ? "ghost compact active" : "ghost compact"}
              onClick={() => setIsRenderedPreviewOpen((current) => !current)}
              title={t(language, "produce.renderPreview")}
            >
              <Eye size={13} /> {t(language, "label.preview")}
            </button>
          </span>
        </span>
        <textarea
          className={valueIssue ? "invalid" : undefined}
          value={props.value}
          onChange={(event) => props.onValue(event.target.value)}
        />
      </label>
      {isRenderedPreviewOpen && (
        <div className="produce-render-preview">
          <div className="produce-render-preview-title">
            <span>{t(language, "produce.renderedPreview")}</span>
            <button type="button" className="ghost compact" onClick={() => setIsRenderedPreviewOpen(false)}>{t(language, "title.close")}</button>
          </div>
          {templateIssues.length > 0 && (
            <div className="produce-template-issues">
              <strong>{t(language, "produce.dynamicFieldIssues")}</strong>
              {templateIssues.map((issue, index) => (
                <span key={`${issue.field}-${issue.token}-${index}`}>
                  {formatTemplateIssue(issue, language)}
                </span>
              ))}
            </div>
          )}
          <div className="produce-render-preview-grid">
            <div className="produce-render-preview-field">
              <span>{t(language, "label.key")}</span>
              <pre><code>{renderedPreview.key || t(language, "label.noKey")}</code></pre>
            </div>
            <div className="produce-render-preview-field">
              <span>{t(language, "label.headers")}</span>
              <pre><code>{renderedPreview.headers.trim() ? tryPrettyJson(renderedPreview.headers) : "{ }"}</code></pre>
            </div>
            <div className="produce-render-preview-field">
              <span>{t(language, "label.value")}</span>
              <pre><code>{renderedPreview.value ? tryPrettyJson(renderedPreview.value) : t(language, "label.emptyValue")}</code></pre>
            </div>
          </div>
        </div>
      )}
      {valueIssue && (
        <div className="produce-value-error">
          <span>{valueIssue.message}</span>
          {valueIssue.line > 0 && <span>Line {valueIssue.line}, column {valueIssue.column}</span>}
          {valueIssue.snippet && (
            <pre className="produce-error-snippet">
              <code>{valueIssue.snippet}</code>
              <code>{`${" ".repeat(valueIssue.caretColumn)}^`}</code>
            </pre>
          )}
        </div>
      )}
      {mode === "interval" && (
        <div className="produce-template-panel">
          <div className="produce-interval-warning">
            {t(language, "produce.intervalWarning")}
          </div>
          <details className="produce-template-guide">
            <summary>Dynamic field guide</summary>
            <div className="produce-template-examples">
              {getProduceTemplateExamples().map((example) => (
                <div key={example.syntax} className="produce-template-example">
                  <code>{example.syntax}</code>
                  <span>{example.description}</span>
                </div>
              ))}
            </div>
          </details>
          {isConfirmingInterval && (
            <div className="produce-interval-confirm">
              <strong>{t(language, "produce.confirmTitle")}</strong>
              <span>{t(language, "produce.confirmTopic", { topic: props.topic })}</span>
              <span>{t(language, "produce.confirmEvery", { every: String(intervalPlan.delay) })}</span>
              <span>
                {stopMode === "count"
                  ? t(language, "produce.confirmCount", { count: String(intervalPlan.count) })
                  : t(language, "produce.confirmDuration", { duration: durationText })}
              </span>
              <span>{t(language, "produce.confirmEstimated", { count: String(intervalPlan.estimatedMax) })}</span>
              <div className="produce-interval-confirm-actions">
                <button type="button" className="ghost compact" onClick={() => setIsConfirmingInterval(false)}>{t(language, "action.cancel")}</button>
                <button type="button" className="primary compact" onClick={() => void startIntervalProduce()}>{t(language, "produce.confirmStart")}</button>
              </div>
            </div>
          )}
          {props.intervalState.isRunning && (
            <div className="produce-interval-running">
              <span>Running</span>
              <span>{props.topic}</span>
              <span>{props.intervalState.sentCount} sent</span>
              <span>{formatProduceElapsed(Date.now() - props.intervalState.startedAt)}</span>
            </div>
          )}
          {(intervalError || props.intervalState.error) && <div className="produce-interval-error">{intervalError || props.intervalState.error}</div>}
        </div>
      )}
      {mode === "single" ? (
        <button className="primary wide" onClick={props.onProduce} disabled={!props.topic}>
          <Send size={16} /> {t(language, "action.sendMessage")}
        </button>
      ) : (
        <button
          className={props.intervalState.isRunning ? "danger wide" : "primary wide"}
          type="button"
          onClick={props.intervalState.isRunning ? props.onStopInterval : requestIntervalStart}
          disabled={!props.topic}
        >
          {props.intervalState.isRunning ? <Square size={16} /> : <Play size={16} />}
          {props.intervalState.isRunning ? t(language, "action.stopInterval") : t(language, "action.startInterval")}
        </button>
      )}
    </section>
  );
}

function createTemplateId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function tryPrettyJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function formatTemplateIssue(issue: ProduceTemplateIssue, language: ReturnType<typeof useAppLanguage>) {
  const fieldKey = issue.field === "key" ? "label.key" : issue.field === "headers" ? "label.headers" : "label.value";
  return `${t(language, fieldKey)} ${issue.token}: ${issue.message}`;
}

function getJsonValueIssue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null;
  const validationMessage = validateJsonLikeValue(value);
  if (!validationMessage) return null;
  const position = getJsonErrorPosition(validationMessage);
  if (position < 0) {
    return { caretColumn: 0, column: 0, line: 0, message: validationMessage, snippet: "" };
  }
  const location = getTextLocation(value, position);
  const lineText = value.split(/\r?\n/)[location.line - 1] ?? "";
  return {
    caretColumn: Math.max(0, location.column - 1),
    column: location.column,
    line: location.line,
    message: validationMessage,
    snippet: lineText
  };
}

function getJsonErrorPosition(message: string) {
  const match = /position (\d+)/i.exec(message);
  return match ? Number(match[1]) : -1;
}

function getTextLocation(value: string, position: number) {
  const prefix = value.slice(0, Math.max(0, position));
  const lines = prefix.split(/\r?\n/);
  return {
    column: (lines[lines.length - 1]?.length ?? 0) + 1,
    line: lines.length
  };
}
