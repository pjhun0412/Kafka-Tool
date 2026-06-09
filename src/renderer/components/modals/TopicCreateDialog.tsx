import { Plus, Trash2, X } from "lucide-react";
import type { TopicCreateForm } from "../../stores/ui/topicCreateStore";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";

const topicConfigOptions = [
  "compression.type",
  "delete.retention.ms",
  "file.delete.delay.ms",
  "flush.messages",
  "flush.ms",
  "index.interval.bytes",
  "max.compaction.lag.ms",
  "message.timestamp.type",
  "min.cleanable.dirty.ratio",
  "preallocate",
  "segment.bytes",
  "segment.index.bytes",
  "segment.jitter.ms",
  "segment.ms",
  "unclean.leader.election.enable"
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

function nextConfigId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type TopicCreateDialogProps = {
  form: TopicCreateForm;
  loading: boolean;
  onForm: (form: TopicCreateForm) => void;
  onClose: () => void;
  onCreate: () => void;
};

export function TopicCreateDialog({ form, loading, onForm, onClose, onCreate }: TopicCreateDialogProps) {
  const language = useAppLanguage();
  const usedConfigNames = new Set(form.configs.map((config) => config.name).filter(Boolean));
  const canCreate = form.topic.trim().length > 0 &&
    Number(form.partitions) >= 1 &&
    Number(form.replicationFactor) >= 1 &&
    form.configs.every((config) => !config.name || config.value.trim().length > 0);

  function updateConfig(id: string, patch: Partial<TopicCreateForm["configs"][number]>) {
    onForm({
      ...form,
      configs: form.configs.map((config) => config.id === id ? { ...config, ...patch } : config)
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="server-modal topic-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topic-create-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-title">
          <div>
            <span className="eyebrow">{t(language, "topicCreate.eyebrow")}</span>
            <h2 id="topic-create-title">{t(language, "topicCreate.title")}</h2>
          </div>
          <button className="modal-close" onClick={onClose} title={t(language, "title.close")}>
            <X size={18} />
          </button>
        </div>
        <label>
          {t(language, "label.topicName")}
          <input
            value={form.topic}
            onChange={(event) => onForm({ ...form, topic: event.target.value })}
            placeholder="new-topic"
            autoFocus
          />
        </label>
        <div className="topic-create-grid">
          <label>
            {t(language, "label.partitions")}
            <input
              type="number"
              min={1}
              value={form.partitions}
              onChange={(event) => onForm({ ...form, partitions: event.target.value })}
            />
          </label>
          <label>
            {t(language, "label.cleanupPolicy")}
            <select
              value={form.cleanupPolicy}
              onChange={(event) => onForm({
                ...form,
                cleanupPolicy: event.target.value as TopicCreateForm["cleanupPolicy"]
              })}
            >
              <option value="delete">Delete</option>
              <option value="compact">Compact</option>
              <option value="compact,delete">Compact + Delete</option>
            </select>
          </label>
          <label>
            {t(language, "label.minInSyncReplicas")}
            <input
              type="number"
              min={1}
              value={form.minInSyncReplicas}
              onChange={(event) => onForm({ ...form, minInSyncReplicas: event.target.value })}
              placeholder={t(language, "label.minInSyncReplicas")}
            />
          </label>
          <label>
            {t(language, "label.replicationFactor")}
            <input
              type="number"
              min={1}
              value={form.replicationFactor}
              onChange={(event) => onForm({ ...form, replicationFactor: event.target.value })}
            />
          </label>
        </div>
        <label className="topic-create-retention">
          <span>{t(language, "label.retentionMs")}</span>
          <input
            type="number"
            min={-1}
            value={form.retentionMs}
            onChange={(event) => onForm({ ...form, retentionMs: event.target.value })}
            placeholder={t(language, "label.retentionMs")}
          />
          <div className="topic-create-presets">
            {retentionPresets.map((preset) => (
              <button key={preset.value} type="button" onClick={() => onForm({ ...form, retentionMs: preset.value })}>
                {preset.label}
              </button>
            ))}
          </div>
        </label>
        <div className="topic-create-grid topic-create-size-grid">
          <label>
            {t(language, "label.retentionBytesGb")}
            <select value={form.retentionBytes} onChange={(event) => onForm({ ...form, retentionBytes: event.target.value })}>
              {retentionByteOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            {t(language, "label.maxMessageBytes")}
            <input
              type="number"
              min={1}
              value={form.maxMessageBytes}
              onChange={(event) => onForm({ ...form, maxMessageBytes: event.target.value })}
              placeholder={t(language, "label.maxMessageBytes")}
            />
          </label>
        </div>
        <section className="form-section topic-create-configs">
          <div className="form-section-title">
            <span>{t(language, "label.customParameters")}</span>
            <button
              className="ghost compact"
              type="button"
              onClick={() => onForm({
                ...form,
                configs: [...form.configs, { id: nextConfigId(), name: "", value: "" }]
              })}
            >
              <Plus size={14} />
              {t(language, "label.addCustomParameter")}
            </button>
          </div>
          {form.configs.length === 0 && <p className="muted-help">{t(language, "topicCreate.configHelp")}</p>}
          {form.configs.map((config) => (
            <div className="topic-create-config-row" key={config.id}>
              <label>
                {t(language, "label.key")}
                <select value={config.name} onChange={(event) => updateConfig(config.id, { name: event.target.value })}>
                  <option value="">{t(language, "label.selectParameter")}</option>
                  {topicConfigOptions.map((option) => (
                    <option key={option} value={option} disabled={usedConfigNames.has(option) && config.name !== option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t(language, "label.value")}
                <input
                  value={config.value}
                  onChange={(event) => updateConfig(config.id, { value: event.target.value })}
                  placeholder={t(language, "placeholder.value")}
                />
              </label>
              <button
                className="icon-button"
                type="button"
                title={t(language, "title.removeCustomParameter")}
                onClick={() => onForm({ ...form, configs: form.configs.filter((item) => item.id !== config.id) })}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </section>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>{t(language, "action.cancel")}</button>
          <button className="primary" onClick={onCreate} disabled={!canCreate || loading}>
            <Plus size={16} />
            {loading ? t(language, "topicCreate.creating") : t(language, "topicCreate.create")}
          </button>
        </div>
      </section>
    </div>
  );
}
