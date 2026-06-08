import { Pencil, Trash2 } from "lucide-react";
import type { ManualAvroSchemaRow } from "../../../hooks/preferences/useManualAvroSchemaSummary";

export function AvroSchemasPreferences(props: {
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onOpenManualAvroSchema: (serverId: string, topic: string) => void;
  onDeleteManualAvroSchema: (serverId: string, topic: string) => void;
}) {
  return (
    <section className="avro-schema-manager">
      <div className="manager-header">
        <div>
          <strong>Registered Avro Schemas</strong>
          <span>Manage topic-level schemas used for Consume decoding and Produce serialization.</span>
        </div>
      </div>
      {props.manualAvroSchemaRows.length === 0 ? (
        <div className="manager-empty">No Avro schemas registered. Use a topic context menu or the Schema button on an opened topic.</div>
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
                  <Pencil size={14} /> Edit
                </button>
                <button className="ghost compact danger-inline" onClick={() => props.onDeleteManualAvroSchema(row.serverId, row.topic)}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
