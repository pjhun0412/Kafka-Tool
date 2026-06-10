import { encodeManualAvro } from "../avroDecoder.js";
import { createKafka } from "../kafkaClient.js";
import { getProfile, readPreferences } from "../storage.js";
import type {
  ProduceRequest,
  ProducedMessage
} from "../../shared/types.js";

export async function produceMessages(request: ProduceRequest): Promise<ProducedMessage[]> {
  const profile = await getProfile(request.serverId);
  const preferences = await readPreferences();
  const manualSchema = preferences.manualAvroSchemasByServer?.[request.serverId]?.[request.topic];
  const producer = createKafka(profile).producer();
  await producer.connect();
  try {
    const value = encodeManualAvro(profile, request.topic, request.value, manualSchema);
    const result = await producer.send({
      topic: request.topic,
      messages: [
        {
          key: request.key || undefined,
          value,
          headers: request.headers
        }
      ]
    });
    return result.map((item) => ({
      topic: request.topic,
      partition: item.partition,
      offset: item.baseOffset
    }));
  } finally {
    await producer.disconnect();
  }
}
