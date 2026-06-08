import type { ManualAvroSchema } from "../shared/types";
import type { ManualAvroForm } from "./hooks/useManualAvroSchemaForm";

export function validateManualAvroSchemaForm(form: ManualAvroForm) {
  const schema = form.schema.trim();
  if (!schema) {
    return "Enter schema JSON or upload a schema file.";
  }
  try {
    JSON.parse(schema);
    if (form.encoding === "confluent") {
      const schemaId = Number(form.schemaId);
      if (!Number.isInteger(schemaId) || schemaId < 0) {
        return "Confluent wire format requires a numeric schema id.";
      }
    }
    return "";
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return `Schema JSON is invalid. ${detail}`;
  }
}

export function buildManualAvroSchema(form: ManualAvroForm): ManualAvroSchema {
  return {
    encoding: form.encoding,
    schemaId: form.encoding === "confluent" ? Number(form.schemaId) : undefined,
    schema: form.schema,
    updatedAt: new Date().toISOString()
  };
}
