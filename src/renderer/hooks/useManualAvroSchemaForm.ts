import {
  emptyManualAvroForm,
  useManualAvroSchemaStore,
  type ManualAvroForm
} from "../stores/ui/manualAvroSchemaStore";

export { emptyManualAvroForm };
export type { ManualAvroForm };

export function useManualAvroSchemaForm() {
  const manualAvroForm = useManualAvroSchemaStore((state) => state.manualAvroForm);
  const setManualAvroForm = useManualAvroSchemaStore((state) => state.setManualAvroForm);
  const isManualAvroOpen = useManualAvroSchemaStore((state) => state.isManualAvroOpen);
  const setIsManualAvroOpen = useManualAvroSchemaStore((state) => state.setIsManualAvroOpen);
  const isSchemaDragOver = useManualAvroSchemaStore((state) => state.isSchemaDragOver);
  const setIsSchemaDragOver = useManualAvroSchemaStore((state) => state.setIsSchemaDragOver);
  const closeManualAvroForm = useManualAvroSchemaStore((state) => state.closeManualAvroForm);

  return {
    manualAvroForm,
    setManualAvroForm,
    isManualAvroOpen,
    setIsManualAvroOpen,
    isSchemaDragOver,
    setIsSchemaDragOver,
    closeManualAvroForm
  };
}
