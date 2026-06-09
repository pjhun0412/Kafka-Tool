import { Braces, Send } from "lucide-react";
import type { ManualAvroSchema } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

export function ProducePanel(props: {
  topic: string;
  keyText: string;
  headers: string;
  value: string;
  hasAvroSchema: boolean;
  avroEncoding?: ManualAvroSchema["encoding"];
  onKey: (value: string) => void;
  onHeaders: (value: string) => void;
  onValue: (value: string) => void;
  onProduce: () => void;
}) {
  const language = useAppLanguage();
  return (
    <section className="panel produce-panel">
      <div className="section-title">
        <h2>{t(language, "label.produce")}</h2>
        <span>{props.topic || t(language, "label.topicRequired")}</span>
      </div>
      {props.hasAvroSchema && (
        <div className="produce-schema-notice">
          <Braces size={15} />
          {t(language, "label.avroSerializationEnabled")} ({props.avroEncoding === "confluent" ? "Confluent" : "Raw"})
        </div>
      )}
      <label>{t(language, "label.key")}<input value={props.keyText} onChange={(event) => props.onKey(event.target.value)} placeholder={t(language, "placeholder.optionalKey")} /></label>
      <label>{t(language, "label.headers")}<textarea className="headers-editor" value={props.headers} onChange={(event) => props.onHeaders(event.target.value)} placeholder="{ }" /></label>
      <label>{t(language, "label.value")}<textarea value={props.value} onChange={(event) => props.onValue(event.target.value)} /></label>
      <button className="primary wide" onClick={props.onProduce} disabled={!props.topic}><Send size={16} /> {t(language, "action.sendMessage")}</button>
    </section>
  );
}
