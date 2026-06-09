import { Pencil, Trash2 } from "lucide-react";
import type { ManualAvroSchemaRow } from "../../../hooks/preferences/useManualAvroSchemaSummary";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

export function AvroSchemasPreferences(props: {
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onOpenManualAvroSchema: (serverId: string, topic: string) => void;
  onDeleteManualAvroSchema: (serverId: string, topic: string) => void;
}) {
  const language = useAppLanguage();
  return (
    <section className="avro-schema-manager">
      <div className="manager-header">
        <div>
          <strong>{t(language, "label.registeredAvroSchemas")}</strong>
          <span>{t(language, "label.avroSchemasHelp")}</span>
        </div>
      </div>
      {props.manualAvroSchemaRows.length === 0 ? (
        <div className="manager-empty">{t(language, "label.noAvroSchemas")}</div>
      ) : (
        <div className="schema-manager-list">
          {props.manualAvroSchemaRows.map((row) => (
            <div className="schema-manager-row" key={`${row.serverId}:${row.topic}`}>
              <div className="schema-manager-main">
                <strong title={row.topic}>{row.topic}</strong>
                <span title={row.serverName}>{row.serverName}</span>
              </div>
              <span className="schema-manager-pill">{row.schema.encoding === "confluent" ? `Confluent #${row.schema.schemaId ?? "-"}` : "Raw"}</span>
              <span className="schema-manager-date">{new Date(row.schema.updatedAt).toLocaleString()}</span>
              <div className="schema-manager-actions">
                <button className="ghost compact" onClick={() => props.onOpenManualAvroSchema(row.serverId, row.topic)}>
                  <Pencil size={14} /> {t(language, "label.edit")}
                </button>
                <button className="ghost compact danger-inline" onClick={() => props.onDeleteManualAvroSchema(row.serverId, row.topic)}>
                  <Trash2 size={14} /> {t(language, "action.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
