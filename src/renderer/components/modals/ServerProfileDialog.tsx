import { Plug, X } from "lucide-react";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";
import type { ServerForm } from "../../serverProfileForm";

type ServerProfileDialogProps = {
  form: ServerForm;
  editing: boolean;
  loading: boolean;
  onForm: (form: ServerForm) => void;
  onClose: () => void;
  onSave: () => void;
};

export function ServerProfileDialog({ form, editing, loading, onForm, onClose, onSave }: ServerProfileDialogProps) {
  const language = useAppLanguage();
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
        <label>
          {t(language, "serverDialog.serverName")}
          <input value={form.name} onChange={(event) => onForm({ ...form, name: event.target.value })} placeholder="local" autoFocus />
        </label>
        <label>
          {t(language, "serverDialog.brokers")}
          <input value={form.brokers} onChange={(event) => onForm({ ...form, brokers: event.target.value })} placeholder="localhost:9092, localhost:9093" />
        </label>
        <section className="form-section">
          <div className="form-section-title">
            <span>{t(language, "serverDialog.kafkaSecurity")}</span>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.ssl}
              onChange={(event) => onForm({ ...form, ssl: event.target.checked })}
            />
            {t(language, "serverDialog.useSsl")}
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.oauthEnabled}
              onChange={(event) => onForm({ ...form, oauthEnabled: event.target.checked })}
            />
            SASL/OAUTHBEARER
          </label>
          {form.oauthEnabled && (
            <div className="auth-grid">
              <label>
                {t(language, "serverDialog.tokenEndpoint")}
                <input value={form.oauthTokenEndpoint} onChange={(event) => onForm({ ...form, oauthTokenEndpoint: event.target.value })} placeholder="https://auth.example.com/oauth2/token" />
              </label>
              <label>
                {t(language, "serverDialog.clientId")}
                <input value={form.oauthClientId} onChange={(event) => onForm({ ...form, oauthClientId: event.target.value })} placeholder="kafka-client" />
              </label>
              <label>
                {t(language, "serverDialog.clientSecret")}
                <input type="password" value={form.oauthClientSecret} onChange={(event) => onForm({ ...form, oauthClientSecret: event.target.value })} placeholder={t(language, "placeholder.clientSecret")} />
              </label>
              <label>
                {t(language, "serverDialog.scope")}
                <input value={form.oauthScope} onChange={(event) => onForm({ ...form, oauthScope: event.target.value })} placeholder={t(language, "placeholder.optional")} />
              </label>
              <label>
                {t(language, "serverDialog.audience")}
                <input value={form.oauthAudience} onChange={(event) => onForm({ ...form, oauthAudience: event.target.value })} placeholder={t(language, "placeholder.optional")} />
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
                onChange={(event) => onForm({ ...form, schemaRegistryUrl: event.target.value })}
                placeholder="http://schema-registry:8081"
              />
            </label>
            <label>
              {t(language, "serverDialog.registryAuth")}
              <select
                value={form.schemaRegistryAuthType}
                onChange={(event) => onForm({ ...form, schemaRegistryAuthType: event.target.value as ServerForm["schemaRegistryAuthType"] })}
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
                <input value={form.schemaRegistryUsername} onChange={(event) => onForm({ ...form, schemaRegistryUsername: event.target.value })} />
              </label>
              <label>
                {t(language, "serverDialog.password")}
                <input type="password" value={form.schemaRegistryPassword} onChange={(event) => onForm({ ...form, schemaRegistryPassword: event.target.value })} />
              </label>
            </div>
          )}
          {form.schemaRegistryAuthType === "bearer" && (
            <label>
              {t(language, "serverDialog.bearerToken")}
              <input type="password" value={form.schemaRegistryToken} onChange={(event) => onForm({ ...form, schemaRegistryToken: event.target.value })} />
            </label>
          )}
        </section>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>{t(language, "serverDialog.cancel")}</button>
          <button className="primary" onClick={onSave} disabled={loading}>
            <Plug size={16} /> {editing ? t(language, "serverDialog.saveEdit") : t(language, "serverDialog.saveAdd")}
          </button>
        </div>
      </section>
    </div>
  );
}
