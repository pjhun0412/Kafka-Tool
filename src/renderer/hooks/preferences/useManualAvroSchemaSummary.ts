import { useMemo } from "react";
import type { ManualAvroSchema, ServerProfile } from "../../../shared/types";

export type ManualAvroSchemaRow = {
  serverId: string;
  serverName: string;
  topic: string;
  schema: ManualAvroSchema;
};

export function useManualAvroSchemaSummary(
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>,
  servers: ServerProfile[],
  selectedServerId: string
) {
  const manualAvroTopicNames = useMemo(
    () => new Set(Object.keys(manualAvroSchemasByServer[selectedServerId] ?? {})),
    [manualAvroSchemasByServer, selectedServerId]
  );

  const manualAvroSchemaRows = useMemo<ManualAvroSchemaRow[]>(
    () => Object.entries(manualAvroSchemasByServer).flatMap(([serverId, schemas]) => {
      const server = servers.find((item) => item.id === serverId);
      return Object.entries(schemas).map(([topic, schema]) => ({
        serverId,
        serverName: server?.name ?? serverId,
        topic,
        schema
      }));
    }).sort((left, right) => `${left.serverName}:${left.topic}`.localeCompare(`${right.serverName}:${right.topic}`)),
    [manualAvroSchemasByServer, servers]
  );

  return { manualAvroTopicNames, manualAvroSchemaRows };
}
