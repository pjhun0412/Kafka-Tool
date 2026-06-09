import avro from "avsc";
import type { ConsumedMessage, ManualAvroSchema, ServerProfile } from "../shared/types.js";

type SchemaRegistryConfig = NonNullable<ServerProfile["schemaRegistry"]>;
type AvroType = ReturnType<typeof avro.Type.forSchema>;

const avroTypeCache = new Map<string, AvroType>();
const pendingAvroTypeCache = new Map<string, Promise<AvroType>>();
const manualAvroTypeCache = new Map<string, AvroType>();

function schemaCacheKey(serverId: string, registryUrl: string, schemaId: number) {
  return `${serverId}:${registryUrl.replace(/\/+$/, "")}:${schemaId}`;
}

function getRegistryHeaders(config: SchemaRegistryConfig) {
  const headers: Record<string, string> = {
    accept: "application/vnd.schemaregistry.v1+json, application/json"
  };
  if (config.auth?.type === "basic" && config.auth.username !== undefined) {
    const token = Buffer.from(`${config.auth.username}:${config.auth.password ?? ""}`).toString("base64");
    headers.authorization = `Basic ${token}`;
  }
  if (config.auth?.type === "bearer" && config.auth.token) {
    headers.authorization = `Bearer ${config.auth.token}`;
  }
  return headers;
}

function normalizeDecodedValue(value: unknown): unknown {
  if (Buffer.isBuffer(value)) {
    return value.toString("base64");
  }
  if (Array.isArray(value)) {
    return value.map(normalizeDecodedValue);
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = normalizeDecodedValue(item);
    }
    return output;
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

async function fetchAvroType(profile: ServerProfile, config: SchemaRegistryConfig, schemaId: number) {
  const baseUrl = config.url.trim().replace(/\/+$/, "");
  const cacheKey = schemaCacheKey(profile.id, baseUrl, schemaId);
  const cached = avroTypeCache.get(cacheKey);
  if (cached) return cached;
  const pending = pendingAvroTypeCache.get(cacheKey);
  if (pending) return pending;

  const pendingFetch = (async () => {
    const response = await fetch(`${baseUrl}/schemas/ids/${schemaId}`, {
      headers: getRegistryHeaders(config)
    });
    const payload = await response.json().catch(() => ({})) as { schema?: unknown; message?: unknown };
    if (!response.ok || typeof payload.schema !== "string") {
      throw new Error(`Schema Registry returned ${response.status}. ${String(payload.message ?? response.statusText)}`);
    }

    const schema = JSON.parse(payload.schema) as avro.Schema;
    const type = avro.Type.forSchema(schema);
    avroTypeCache.set(cacheKey, type);
    return type;
  })();

  pendingAvroTypeCache.set(cacheKey, pendingFetch);
  try {
    return await pendingFetch;
  } finally {
    pendingAvroTypeCache.delete(cacheKey);
  }
}

function parseManualAvroType(profile: ServerProfile, topic: string, manualSchema: ManualAvroSchema) {
  const cacheKey = `${profile.id}:${topic}:${manualSchema.encoding}:${manualSchema.schema}`;
  const cached = manualAvroTypeCache.get(cacheKey);
  if (cached) return cached;
  const schema = JSON.parse(manualSchema.schema) as avro.Schema;
  const type = avro.Type.forSchema(schema);
  manualAvroTypeCache.set(cacheKey, type);
  return type;
}

function decodeManualAvro(profile: ServerProfile, topic: string, value: Buffer, manualSchema?: ManualAvroSchema): ConsumedMessage["decoded"] | undefined {
  if (!manualSchema?.schema?.trim()) return undefined;
  try {
    const type = parseManualAvroType(profile, topic, manualSchema);
    const payload = manualSchema.encoding === "confluent" && value.length >= 5 && value[0] === 0
      ? value.subarray(5)
      : value;
    const decoded = type.fromBuffer(payload);
    return {
      format: "avro",
      source: "manual",
      encoding: manualSchema.encoding,
      value: normalizeDecodedValue(decoded)
    };
  } catch (error) {
    return {
      format: "avro",
      source: "manual",
      encoding: manualSchema.encoding,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function parseProduceAvroValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

export function encodeManualAvro(profile: ServerProfile, topic: string, value: string, manualSchema?: ManualAvroSchema): Buffer | string {
  if (!manualSchema?.schema?.trim()) return value;
  const type = parseManualAvroType(profile, topic, manualSchema);
  const payload = type.toBuffer(parseProduceAvroValue(value));
  if (manualSchema.encoding !== "confluent") {
    return payload;
  }
  const schemaId = manualSchema.schemaId;
  if (!Number.isInteger(schemaId) || schemaId === undefined || schemaId < 0) {
    throw new Error("Confluent Avro produce requires a schema id in the topic schema settings.");
  }
  const header = Buffer.alloc(5);
  header.writeUInt8(0, 0);
  header.writeUInt32BE(schemaId, 1);
  return Buffer.concat([header, payload]);
}

export async function decodeConfluentAvro(profile: ServerProfile, topic: string, value?: Buffer | null, manualSchema?: ManualAvroSchema): Promise<ConsumedMessage["decoded"] | undefined> {
  const config = profile.schemaRegistry;
  if (!value) {
    return undefined;
  }
  if (!config?.url?.trim() || value.length < 5 || value[0] !== 0) {
    return decodeManualAvro(profile, topic, value, manualSchema);
  }

  const schemaId = value.readUInt32BE(1);
  try {
    const type = await fetchAvroType(profile, config, schemaId);
    const decoded = type.fromBuffer(value.subarray(5));
    return {
      format: "avro",
      source: "registry",
      schemaId,
      value: normalizeDecodedValue(decoded)
    };
  } catch (error) {
    return decodeManualAvro(profile, topic, value, manualSchema) ?? {
      format: "avro",
      source: "registry",
      schemaId,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
