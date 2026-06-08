import React, { useEffect, useMemo, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import type { TopicConfigEntry } from "../../../../shared/types";

type CustomConfigDraft = {
  id: string;
  name: string;
  value: string;
};

const editableSettingKeys = [
  "cleanup.policy",
  "min.insync.replicas",
  "retention.ms",
  "retention.bytes",
  "max.message.bytes"
];

const retentionPresets = [
  { label: "12 hours", value: "43200000" },
  { label: "1 day", value: "86400000" },
  { label: "2 days", value: "172800000" },
  { label: "7 days", value: "604800000" },
  { label: "4 weeks", value: "2419200000" }
];

const retentionByteOptions = [
  { label: "Not Set", value: "-1" },
  { label: "1 GB", value: "1073741824" },
  { label: "10 GB", value: "10737418240" },
  { label: "20 GB", value: "21474836480" },
  { label: "50 GB", value: "53687091200" }
];

function getConfigValue(config: TopicConfigEntry) {
  if (config.isSensitive) return "********";
  if (config.value === "") return "null";
  return config.value;
}

function isEditableConfig(config: TopicConfigEntry) {
  return !config.readOnly && !config.isSensitive;
}

function buildDrafts(configs: TopicConfigEntry[]) {
  return Object.fromEntries(configs.map((config) => [config.name, config.isSensitive ? "" : config.value]));
}

function nextCustomId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function TopicSettingsPanel({ serverId, topic }: { serverId: string; topic: string }) {
  const [configs, setConfigs] = useState<TopicConfigEntry[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [customDrafts, setCustomDrafts] = useState<CustomConfigDraft[]>([]);
  const visibleConfigs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return configs;
    return configs.filter((config) => (
      config.name.toLowerCase().includes(normalizedQuery) ||
      config.value.toLowerCase().includes(normalizedQuery) ||
      config.source.toLowerCase().includes(normalizedQuery)
    ));
  }, [configs, query]);
  const configByName = useMemo(() => new Map(configs.map((config) => [config.name, config])), [configs]);
  const customParameterOptions = useMemo(() => {
    const selectedNames = new Set(customDrafts.map((draft) => draft.name).filter(Boolean));
    const mainKeys = new Set(editableSettingKeys);
    return configs
      .filter((config) => !mainKeys.has(config.name))
      .map((config) => ({
        name: config.name,
        enabled: isEditableConfig(config) && !selectedNames.has(config.name)
      }))
      .sort((left, right) => {
        if (left.enabled !== right.enabled) return left.enabled ? -1 : 1;
        return left.name.localeCompare(right.name);
      });
  }, [configs, customDrafts]);
  const changedCount = configs.filter((config) => {
    if (!editableSettingKeys.includes(config.name)) return false;
    if (config.isSensitive) return drafts[config.name]?.trim().length > 0;
    return (drafts[config.name] ?? "") !== config.value;
  }).length + customDrafts.filter((draft) => draft.name.trim()).length;

  function applyConfigs(nextConfigs: TopicConfigEntry[]) {
    setConfigs(nextConfigs);
    setDrafts(buildDrafts(nextConfigs));
    setCustomDrafts([]);
  }

  function loadConfigs() {
    if (!serverId || !topic) return;
    setLoading(true);
    setError("");
    window.kafkaApi.getTopicConfigs(serverId, topic)
      .then(applyConfigs)
      .catch((nextError: unknown) => {
        setConfigs([]);
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadConfigs();
  }, [serverId, topic]);

  useEffect(() => {
    function handleEditSettings(event: Event) {
      const detail = (event as CustomEvent<{ serverId: string; topic: string }>).detail;
      if (detail?.serverId !== serverId || detail.topic !== topic) return;
      setEditing(true);
    }
    window.addEventListener("topic-settings-edit", handleEditSettings);
    return () => window.removeEventListener("topic-settings-edit", handleEditSettings);
  }, [serverId, topic]);

  async function saveSettings() {
    const changedEntries = editableSettingKeys.flatMap((name) => {
      const config = configByName.get(name);
      if (!config) return [];
      const value = drafts[config.name] ?? "";
      if (config.isSensitive && value.trim().length === 0) return [];
      if (!config.isSensitive && value === config.value) return [];
      return [{ name: config.name, value }];
    });
    const customEntries = customDrafts
      .map((draft) => ({ name: draft.name.trim(), value: draft.value }))
      .filter((draft) => draft.name);
    const entries = [...changedEntries, ...customEntries];
    if (entries.length === 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const nextConfigs = await window.kafkaApi.updateTopicConfigs({ serverId, topic, entries });
      applyConfigs(nextConfigs);
      setEditing(false);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setDrafts(buildDrafts(configs));
    setCustomDrafts([]);
    setEditing(false);
    setError("");
  }

  if (!topic) return <section className="panel empty">토픽을 선택하세요.</section>;

  return (
    <section className="panel topic-settings-panel">
      <div className="section-title">
        <h2>{topic}</h2>
        <span>{configs.length} settings</span>
      </div>
      <div className="topic-settings-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by key or value" />
        <button type="button" onClick={() => setEditing(true)}>Edit settings</button>
      </div>
      {error && <div className="broker-detail-error">{error}</div>}
      {loading ? (
        <div className="broker-detail-empty">Loading topic settings...</div>
      ) : (
        <div className="topic-settings-table">
          <div className="topic-settings-row topic-settings-heading">
            <span>Key</span>
            <span>Value</span>
            <span>Source</span>
          </div>
          {visibleConfigs.map((config) => (
            <div className={isEditableConfig(config) ? "topic-settings-row editable" : "topic-settings-row readonly"} key={config.name}>
              <strong title={config.name}>{config.name}</strong>
              <span title={getConfigValue(config)}>{getConfigValue(config)}</span>
              <span>{config.source}</span>
            </div>
          ))}
          {visibleConfigs.length === 0 && <div className="broker-detail-empty">No settings matched</div>}
        </div>
      )}
      {editing && (
        <div className="topic-settings-edit-layer">
          <div className="topic-settings-edit-panel">
            <div className="topic-settings-edit-header">
              <div>
                <h3>Edit settings</h3>
                <span>{topic}</span>
              </div>
              <button type="button" title="Close" onClick={cancelEdit}><X size={16} /></button>
            </div>
            <div className="topic-settings-form">
              <label>
                <span>Topic Name</span>
                <input value={topic} disabled />
              </label>
              <label>
                <span>Cleanup policy</span>
                <select value={drafts["cleanup.policy"] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, "cleanup.policy": event.target.value }))}>
                  <option value="">Not Set</option>
                  <option value="delete">Delete</option>
                  <option value="compact">Compact</option>
                  <option value="compact,delete">Compact + Delete</option>
                </select>
              </label>
              <label>
                <span>Min In Sync Replicas</span>
                <input value={drafts["min.insync.replicas"] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, "min.insync.replicas": event.target.value }))} />
              </label>
              <label>
                <span>Time to retain data (in ms)</span>
                <input value={drafts["retention.ms"] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, "retention.ms": event.target.value }))} />
              </label>
              <div className="topic-settings-presets">
                {retentionPresets.map((preset) => (
                  <button key={preset.value} type="button" onClick={() => setDrafts((current) => ({ ...current, "retention.ms": preset.value }))}>
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="topic-settings-form-grid">
                <label>
                  <span>Max size on disk in GB</span>
                  <select value={drafts["retention.bytes"] ?? "-1"} onChange={(event) => setDrafts((current) => ({ ...current, "retention.bytes": event.target.value }))}>
                    {retentionByteOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Maximum message size in bytes</span>
                  <input value={drafts["max.message.bytes"] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, "max.message.bytes": event.target.value }))} />
                </label>
              </div>
              <div className="topic-settings-custom-header">
                <strong>Custom parameters</strong>
                <button type="button" onClick={() => setCustomDrafts((current) => [...current, { id: nextCustomId(), name: "", value: "" }])}>
                  <Plus size={14} /> Add Custom Parameter
                </button>
              </div>
              {customDrafts.map((draft) => (
                <div className="topic-settings-custom-row" key={draft.id}>
                  <select
                    value={draft.name}
                    onChange={(event) => setCustomDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, name: event.target.value } : item))}
                  >
                    <option value="">Select parameter</option>
                    {customParameterOptions.map((option) => (
                      <option key={option.name} value={option.name} disabled={!option.enabled}>{option.name}</option>
                    ))}
                  </select>
                  <input
                    value={draft.value}
                    placeholder="value"
                    onChange={(event) => setCustomDrafts((current) => current.map((item) => item.id === draft.id ? { ...item, value: event.target.value } : item))}
                  />
                  <button type="button" title="Remove custom parameter" onClick={() => setCustomDrafts((current) => current.filter((item) => item.id !== draft.id))}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="topic-settings-edit-actions">
              <button type="button" disabled={saving} onClick={cancelEdit}>Cancel</button>
              <button type="button" disabled={saving || changedCount === 0} onClick={() => void saveSettings()}>
                <Save size={14} /> {saving ? "Saving" : "Update topic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
