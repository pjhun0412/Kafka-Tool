import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Braces, Calendar, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Copy, Download, EyeOff, Filter, HelpCircle, Layers, Play, RefreshCw, Send, Sparkles, Square, Star, Trash2, X, XCircle } from "lucide-react";
import type { BrokerSummary, ConsumedMessage, ConsumerGroupLagDetail, ConsumerGroupLagRow, ConsumerGroupSummary, ManualAvroSchema, MessageExportFormat, ServerProfile, TopicDetail, TopicSummary } from "../../../../shared/types";
import { Button, IconButton } from "../../ui";
import { DataGrid } from "../../DataGrid";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, SplitPaneState, TopicConsumeState, View } from "../../../uiTypes";
import { filterMessages } from "../../../messageFilters";
import { formatCompactNumber, formatCount, formatHeaders, formatMessagePayload, formatPercent, formatTimestamp, getEpochTitle, getPartitionColor, parseJson, previewHeaders, previewValue, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";
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
