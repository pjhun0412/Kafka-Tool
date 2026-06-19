import { Plug, X, Zap } from "lucide-react";
import { useState } from "react";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";
import type { ServerForm } from "../../serverProfileForm";

type ServerProfileDialogProps = {
  form: ServerForm;
  editing: boolean;
  loading: boolean;
  onForm: (form: ServerForm) => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onTest: () => void | Promise<void>;
};

export function ServerProfileDialog({ form, editing, loading, onForm, onClose, onSave, onTest }: ServerProfileDialogProps) {
  const language = useAppLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success">("idle");
  const nameInvalid = submitted && form.name.trim().length === 0;
  const brokersInvalid = (submitted || testSubmitted) && form.brokers.split(",").map((broker) => broker.trim()).filter(Boolean).length === 0;

  function updateForm(nextForm: ServerForm) {
    setError("");
    setTestStatus("idle");
    setTestSubmitted(false);
    onForm(nextForm);
  }

  async function handleSave() {
    setSubmitted(true);
    setTestStatus("idle");
    setError("");
    if (!form.name.trim()) {
      setError(t(language, "serverDialog.errorNameRequired"));
      return;
    }
    if (form.brokers.split(",").map((broker) => broker.trim()).filter(Boolean).length === 0) {
      setError(t(language, "serverDialog.errorBrokerRequired"));
      return;
    }
    try {
      await Promise.resolve(onSave());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }

  async function handleTest() {
    setTestSubmitted(true);
    setError("");
    setTestStatus("idle");
    if (form.brokers.split(",").map((broker) => broker.trim()).filter(Boolean).length === 0) {
      setError(t(language, "serverDialog.errorBrokerRequired"));
      return;
    }
    try {
      setTestStatus("testing");
      await Promise.resolve(onTest());
      setTestStatus("success");
    } catch (nextError) {
      setTestStatus("idle");
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="server-modal" role="dialog" aria-modal="true" aria-labelledby="server-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">{t(language, "serverDialog.eyebrow")}</span>
            <h2 id="server-modal-title">{editing ? t(language, "serverDialog.editTitle") : t(language, "serverDialog.addTitle")}</h2>
          </div>
          <button className="modal-close" onClick={onClose} title={t(language, "title.close")}>
            <X size={18} />
          </button>
        </div>
        <label className={nameInvalid ? "field-invalid" : ""}>
          {t(language, "serverDialog.serverName")}
          <input
            value={form.name}
            onChange={(event) => updateForm({ ...form, name: event.target.value })}
            placeholder="local"
            aria-invalid={nameInvalid}
            autoFocus
          />
          {nameInvalid && <span className="field-error-text">{t(language, "serverDialog.errorNameRequired")}</span>}
        </label>
        <label className={brokersInvalid ? "field-invalid" : ""}>
          {t(language, "serverDialog.brokers")}
          <input
            value={form.brokers}
            onChange={(event) => updateForm({ ...form, brokers: event.target.value })}
            placeholder="localhost:9092, localhost:9093"
            aria-invalid={brokersInvalid}
          />
          {brokersInvalid && <span className="field-error-text">{t(language, "serverDialog.errorBrokerRequired")}</span>}
        </label>
        <section className="form-section">
          <div className="form-section-title">
            <span>{t(language, "serverDialog.kafkaSecurity")}</span>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.ssl}
              onChange={(event) => updateForm({ ...form, ssl: event.target.checked })}
            />
            {t(language, "serverDialog.useSsl")}
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.oauthEnabled}
              onChange={(event) => updateForm({ ...form, oauthEnabled: event.target.checked })}
            />
            SASL/OAUTHBEARER
          </label>
          {form.oauthEnabled && (
            <div className="auth-grid">
              <label>
                {t(language, "serverDialog.tokenEndpoint")}
                <input value={form.oauthTokenEndpoint} onChange={(event) => updateForm({ ...form, oauthTokenEndpoint: event.target.value })} placeholder="https://auth.example.com/oauth2/token" />
              </label>
              <label>
                {t(language, "serverDialog.clientId")}
                <input value={form.oauthClientId} onChange={(event) => updateForm({ ...form, oauthClientId: event.target.value })} placeholder="kafka-client" />
              </label>
              <label>
                {t(language, "serverDialog.clientSecret")}
                <input type="password" value={form.oauthClientSecret} onChange={(event) => updateForm({ ...form, oauthClientSecret: event.target.value })} placeholder={t(language, "placeholder.clientSecret")} />
              </label>
              <label>
                {t(language, "serverDialog.scope")}
                <input value={form.oauthScope} onChange={(event) => updateForm({ ...form, oauthScope: event.target.value })} placeholder={t(language, "placeholder.optional")} />
              </label>
              <label>
                {t(language, "serverDialog.audience")}
                <input value={form.oauthAudience} onChange={(event) => updateForm({ ...form, oauthAudience: event.target.value })} placeholder={t(language, "placeholder.optional")} />
              </label>
            </div>
          )}
        </section>
        <section className="form-section schema-registry-section">
          <div className="form-section-title">
            <span>{t(language, "serverDialog.schemaRegistry")}</span>
          </div>
          <div className="schema-registry-grid">
            <label>
              {t(language, "serverDialog.registryUrl")}
              <input
                value={form.schemaRegistryUrl}
                onChange={(event) => updateForm({ ...form, schemaRegistryUrl: event.target.value })}
                placeholder="http://schema-registry:8081"
              />
            </label>
            <label>
              {t(language, "serverDialog.registryAuth")}
              <select
                value={form.schemaRegistryAuthType}
                onChange={(event) => updateForm({ ...form, schemaRegistryAuthType: event.target.value as ServerForm["schemaRegistryAuthType"] })}
              >
                <option value="none">None</option>
                <option value="basic">Basic</option>
                <option value="bearer">Bearer</option>
              </select>
            </label>
          </div>
          {form.schemaRegistryAuthType === "basic" && (
            <div className="auth-grid">
              <label>
                {t(language, "serverDialog.username")}
                <input value={form.schemaRegistryUsername} onChange={(event) => updateForm({ ...form, schemaRegistryUsername: event.target.value })} />
              </label>
              <label>
                {t(language, "serverDialog.password")}
                <input type="password" value={form.schemaRegistryPassword} onChange={(event) => updateForm({ ...form, schemaRegistryPassword: event.target.value })} />
              </label>
            </div>
          )}
          {form.schemaRegistryAuthType === "bearer" && (
            <label>
              {t(language, "serverDialog.bearerToken")}
              <input type="password" value={form.schemaRegistryToken} onChange={(event) => updateForm({ ...form, schemaRegistryToken: event.target.value })} />
            </label>
          )}
        </section>
        {error && <div className="form-error" role="alert">{error}</div>}
        {testStatus === "success" && <div className="form-success" role="status">{t(language, "serverDialog.testSuccess")}</div>}
        <div className="modal-actions">
          <button className="ghost" onClick={handleTest} disabled={loading || testStatus === "testing"}>
            <Zap size={15} /> {testStatus === "testing" ? t(language, "serverDialog.testing") : t(language, "serverDialog.test")}
          </button>
          <span className="modal-action-spacer" />
          <button className="ghost" onClick={onClose}>{t(language, "serverDialog.cancel")}</button>
          <button className="primary" onClick={handleSave} disabled={loading}>
            <Plug size={16} /> {editing ? t(language, "serverDialog.saveEdit") : t(language, "serverDialog.saveAdd")}
          </button>
        </div>
      </section>
    </div>
  );
}
