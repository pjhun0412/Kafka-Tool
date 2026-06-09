import type { KafkaMessage } from "kafkajs";
import type { ConsumedMessage, ManualAvroSchema, ServerProfile } from "../shared/types.js";
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

export async function toConsumedMessage(profile: ServerProfile, topic: string, partition: number, message: KafkaMessage, manualSchema?: ManualAvroSchema): Promise<ConsumedMessage> {
  return {
    serverId: profile.id,
    topic,
    partition,
    offset: message.offset,
    timestamp: new Date(Number(message.timestamp)).toISOString(),
    key: message.key?.toString("utf8") ?? "",
    value: message.value?.toString("utf8") ?? "",
    headers: mapHeaders(message),
    decoded: await decodeConfluentAvro(profile, topic, message.value, manualSchema)
  };
}
