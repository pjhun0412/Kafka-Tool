import type { Dispatch, SetStateAction } from "react";
import type { ManualAvroSchema } from "../../shared/types";
import type { ToastState } from "../uiTypes";
import { buildManualAvroSchema, validateManualAvroSchemaForm } from "../manualAvroSchema";
import { useManualAvroSchemaStore } from "../stores/ui/manualAvroSchemaStore";

type ManualAvroSchemaActionParams = {
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  setManualAvroSchemasByServer: Dispatch<SetStateAction<Record<string, Record<string, ManualAvroSchema>>>>;
  setToast: Dispatch<SetStateAction<ToastState>>;
};

export function useManualAvroSchemaActions({
  manualAvroSchemasByServer,
  setManualAvroSchemasByServer,
  setToast
}: ManualAvroSchemaActionParams) {
  const manualAvroForm = useManualAvroSchemaStore((state) => state.manualAvroForm);
  const setManualAvroForm = useManualAvroSchemaStore((state) => state.setManualAvroForm);
  const setIsManualAvroOpen = useManualAvroSchemaStore((state) => state.setIsManualAvroOpen);
  const setIsSchemaDragOver = useManualAvroSchemaStore((state) => state.setIsSchemaDragOver);
  const closeManualAvroForm = useManualAvroSchemaStore((state) => state.closeManualAvroForm);

  function openManualAvroSchema(serverId: string, topic: string) {
    if (!serverId || !topic) return;
    const saved = manualAvroSchemasByServer[serverId]?.[topic];
    setManualAvroForm({
      serverId,
      topic,
      encoding: saved?.encoding ?? "raw",
      schemaId: saved?.schemaId === undefined ? "" : String(saved.schemaId),
      schema: saved?.schema ?? "",
      error: ""
    });
    setIsSchemaDragOver(false);
    setIsManualAvroOpen(true);
  }

  function closeManualAvroSchema() {
    closeManualAvroForm();
  }

  async function readSchemaFile(file?: File) {
    if (!file) return;
    const text = await file.text();
    setManualAvroForm((current) => ({ ...current, schema: text, error: "" }));
  }

  function saveManualAvroSchema() {
    const error = validateManualAvroSchemaForm(manualAvroForm);
    if (error) {
      setManualAvroForm((current) => ({ ...current, error }));
      return;
    }
    setManualAvroSchemasByServer((current) => ({
      ...current,
      [manualAvroForm.serverId]: {
        ...(current[manualAvroForm.serverId] ?? {}),
        [manualAvroForm.topic]: buildManualAvroSchema(manualAvroForm)
      }
    }));
    setToast({ message: "Avro schema saved.", kind: "success" });
    closeManualAvroSchema();
  }

  function deleteManualAvroSchema() {
    deleteManualAvroSchemaFor(manualAvroForm.serverId, manualAvroForm.topic);
    closeManualAvroSchema();
  }

  function deleteManualAvroSchemaFor(serverId: string, topic: string) {
    setManualAvroSchemasByServer((current) => {
      const serverSchemas = { ...(current[serverId] ?? {}) };
      delete serverSchemas[topic];
      return { ...current, [serverId]: serverSchemas };
    });
    setToast({ message: "Avro schema removed.", kind: "success" });
  }

  return {
    openManualAvroSchema,
    closeManualAvroSchema,
    readSchemaFile,
    saveManualAvroSchema,
    deleteManualAvroSchema,
    deleteManualAvroSchemaFor
  };
}
