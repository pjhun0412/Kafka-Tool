import React, { useEffect, useMemo, useRef, useState } from "react";
import { Braces, Send } from "lucide-react";
import type { ManualAvroSchema } from "../../../../shared/types";
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
  return (
    <section className="panel produce-panel">
      <div className="section-title">
        <h2>Produce</h2>
        <span>{props.topic || "topic required"}</span>
      </div>
      {props.hasAvroSchema && (
        <div className="produce-schema-notice">
          <Braces size={15} />
          Avro serialization enabled ({props.avroEncoding === "confluent" ? "Confluent" : "Raw"})
        </div>
      )}
      <label>Key<input value={props.keyText} onChange={(event) => props.onKey(event.target.value)} placeholder="optional key" /></label>
      <label>Headers<textarea className="headers-editor" value={props.headers} onChange={(event) => props.onHeaders(event.target.value)} placeholder="{ }" /></label>
      <label>Value<textarea value={props.value} onChange={(event) => props.onValue(event.target.value)} /></label>
      <button className="primary wide" onClick={props.onProduce} disabled={!props.topic}><Send size={16} /> 메시지 전송</button>
    </section>
  );
}
