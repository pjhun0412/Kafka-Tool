import { Braces, FolderOpen, Trash2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ManualAvroSchema, ServerProfile } from "../../../shared/types";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";
import type { ManualAvroForm } from "../../stores/ui/manualAvroSchemaStore";

type ManualAvroSchemaDialogProps = {
  form: ManualAvroForm;
  servers: ServerProfile[];
  registered: boolean;
  isDragOver: boolean;
  onForm: Dispatch<SetStateAction<ManualAvroForm>>;
  onDragOver: (isDragOver: boolean) => void;
  onReadFile: (file?: File) => Promise<void>;
  onDelete: () => void;
  onClose: () => void;
  onSave: () => void;
};

export function ManualAvroSchemaDialog({
  form,
  servers,
  registered,
  isDragOver,
  onForm,
  onDragOver,
  onReadFile,
  onDelete,
  onClose,
  onSave
}: ManualAvroSchemaDialogProps) {
  const language = useAppLanguage();
  const serverName = servers.find((server) => server.id === form.serverId)?.name ?? form.serverId;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="server-modal avro-schema-modal" role="dialog" aria-modal="true" aria-labelledby="manual-avro-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">{t(language, "avro.manual.eyebrow")}</span>
            <h2 id="manual-avro-title">{t(language, "avro.manual.title")}</h2>
          </div>
          <button className="modal-close" onClick={onClose} title={t(language, "title.close")}>
            <X size={18} />
          </button>
        </div>
        <div className="schema-meta">
          <span>{t(language, "label.server")}</span>
          <strong>{serverName}</strong>
          <span>{t(language, "label.topic")}</span>
          <strong>{form.topic}</strong>
        </div>
        <label>
          {t(language, "avro.manual.wireFormat")}
          <select
            value={form.encoding}
            onChange={(event) => onForm((current) => ({ ...current, encoding: event.target.value as ManualAvroSchema["encoding"], error: "" }))}
          >
            <option value="raw">Raw Avro payload</option>
            <option value="confluent">Confluent wire format</option>
          </select>
        </label>
        {form.encoding === "confluent" && (
          <label>
            {t(language, "avro.manual.schemaId")}
            <input
              type="number"
              min={0}
              value={form.schemaId}
              onChange={(event) => onForm((current) => ({ ...current, schemaId: event.target.value, error: "" }))}
              placeholder="1"
            />
          </label>
        )}
        <div className="schema-file-row">
          <label className="ghost schema-file-button">
            <FolderOpen size={15} /> {t(language, "avro.manual.upload")}
            <input
              type="file"
              accept=".avsc,.json,application/json"
              onChange={(event) => {
                void onReadFile(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
          </label>
          <span>{t(language, "avro.manual.help")}</span>
        </div>
        <label
          className={isDragOver ? "schema-drop-zone dragging" : "schema-drop-zone"}
          onDragOver={(event) => {
            event.preventDefault();
            onDragOver(true);
          }}
          onDragLeave={() => onDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            onDragOver(false);
            void onReadFile(event.dataTransfer.files?.[0]);
          }}
        >
          {t(language, "avro.manual.schemaJson")}
          <textarea
            spellCheck={false}
            value={form.schema}
            onChange={(event) => onForm((current) => ({ ...current, schema: event.target.value, error: "" }))}
            placeholder='{"type":"record","name":"Message","fields":[{"name":"id","type":"string"}]}'
          />
        </label>
        {form.error && <div className="form-error">{form.error}</div>}
        <div className="modal-actions">
          {registered && (
            <button className="danger" onClick={onDelete}>
              <Trash2 size={16} /> {t(language, "action.delete")}
            </button>
          )}
          <button className="ghost" onClick={onClose}>{t(language, "action.cancel")}</button>
          <button className="primary" onClick={onSave}>
            <Braces size={16} /> {t(language, "action.save")}
          </button>
        </div>
      </section>
    </div>
  );
}
