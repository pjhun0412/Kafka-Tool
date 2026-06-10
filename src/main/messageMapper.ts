import type { KafkaMessage } from "kafkajs";
import { RAW_PAYLOAD_BASE64_LIMIT_BYTES, type ConsumedMessage, type ManualAvroSchema, type ServerProfile } from "../shared/types.js";
import { decodeConfluentAvro } from "./avroDecoder.js";

function mapHeaders(message: KafkaMessage) {
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(message.headers ?? {})) {
    if (Array.isArray(value)) {
      headers[key] = value.map((item) => (Buffer.isBuffer(item) ? item.toString("utf8") : String(item))).join(", ");
    } else if (value !== undefined) {
      headers[key] = Buffer.isBuffer(value) ? value.toString("utf8") : String(value);
    }
  }
  return headers;
}

function getRawPayload(value?: Buffer | null) {
  const bytes = value?.length ?? 0;
  return {
    base64: value && bytes <= RAW_PAYLOAD_BASE64_LIMIT_BYTES ? value.toString("base64") : "",
    bytes,
    truncated: bytes > RAW_PAYLOAD_BASE64_LIMIT_BYTES
  };
}

export async function toConsumedMessage(profile: ServerProfile, topic: string, partition: number, message: KafkaMessage, manualSchema?: ManualAvroSchema): Promise<ConsumedMessage> {
  const rawKey = getRawPayload(message.key);
  const rawValue = getRawPayload(message.value);
  return {
    serverId: profile.id,
    topic,
    partition,
    offset: message.offset,
    timestamp: new Date(Number(message.timestamp)).toISOString(),
    key: message.key?.toString("utf8") ?? "",
    value: message.value?.toString("utf8") ?? "",
    rawKeyBase64: rawKey.base64,
    rawValueBase64: rawValue.base64,
    rawKeyBytes: rawKey.bytes,
    rawValueBytes: rawValue.bytes,
    rawKeyTruncated: rawKey.truncated,
    rawValueTruncated: rawValue.truncated,
    headers: mapHeaders(message),
    decoded: await decodeConfluentAvro(profile, topic, message.value, manualSchema)
  };
}
