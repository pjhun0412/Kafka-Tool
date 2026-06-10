import { useManualAvroSchemaSummary } from "../preferences";

type ManualAvroSchemaCompositionParams = {
  manualAvroSchemasByServer: Parameters<typeof useManualAvroSchemaSummary>[0];
  servers: Parameters<typeof useManualAvroSchemaSummary>[1];
  selectedServerId: string;
};

export function useManualAvroSchemaComposition(params: ManualAvroSchemaCompositionParams) {
  return useManualAvroSchemaSummary(
    params.manualAvroSchemasByServer,
    params.servers,
    params.selectedServerId
  );
}
