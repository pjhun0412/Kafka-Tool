import { Plug, X } from "lucide-react";
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
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="server-modal" role="dialog" aria-modal="true" aria-labelledby="server-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">Kafka connection</span>
            <h2 id="server-modal-title">{editing ? "Edit server" : "Add server"}</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          서버 이름
          <input value={form.name} onChange={(event) => onForm({ ...form, name: event.target.value })} placeholder="local" autoFocus />
        </label>
        <label>
          브로커
          <input value={form.brokers} onChange={(event) => onForm({ ...form, brokers: event.target.value })} placeholder="localhost:9092, localhost:9093" />
        </label>
        <section className="form-section">
          <div className="form-section-title">
            <span>Kafka Security</span>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.ssl}
              onChange={(event) => onForm({ ...form, ssl: event.target.checked })}
            />
            Use SSL/TLS
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
                Token endpoint
                <input value={form.oauthTokenEndpoint} onChange={(event) => onForm({ ...form, oauthTokenEndpoint: event.target.value })} placeholder="https://auth.example.com/oauth2/token" />
              </label>
              <label>
                Client ID
                <input value={form.oauthClientId} onChange={(event) => onForm({ ...form, oauthClientId: event.target.value })} placeholder="kafka-client" />
              </label>
              <label>
                Client secret
                <input type="password" value={form.oauthClientSecret} onChange={(event) => onForm({ ...form, oauthClientSecret: event.target.value })} placeholder="client secret" />
              </label>
              <label>
                Scope
                <input value={form.oauthScope} onChange={(event) => onForm({ ...form, oauthScope: event.target.value })} placeholder="optional" />
              </label>
              <label>
                Audience
                <input value={form.oauthAudience} onChange={(event) => onForm({ ...form, oauthAudience: event.target.value })} placeholder="optional" />
              </label>
            </div>
          )}
        </section>
        <section className="form-section schema-registry-section">
          <div className="form-section-title">
            <span>Schema Registry</span>
          </div>
          <div className="schema-registry-grid">
            <label>
              Registry URL
              <input
                value={form.schemaRegistryUrl}
                onChange={(event) => onForm({ ...form, schemaRegistryUrl: event.target.value })}
                placeholder="http://schema-registry:8081"
              />
            </label>
            <label>
              Registry Auth
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
                Username
                <input value={form.schemaRegistryUsername} onChange={(event) => onForm({ ...form, schemaRegistryUsername: event.target.value })} />
              </label>
              <label>
                Password
                <input type="password" value={form.schemaRegistryPassword} onChange={(event) => onForm({ ...form, schemaRegistryPassword: event.target.value })} />
              </label>
            </div>
          )}
          {form.schemaRegistryAuthType === "bearer" && (
            <label>
              Bearer token
              <input type="password" value={form.schemaRegistryToken} onChange={(event) => onForm({ ...form, schemaRegistryToken: event.target.value })} />
            </label>
          )}
        </section>
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>취소</button>
          <button className="primary" onClick={onSave} disabled={loading}>
            <Plug size={16} /> {editing ? "수정" : "등록"}
          </button>
        </div>
      </section>
    </div>
  );
}
