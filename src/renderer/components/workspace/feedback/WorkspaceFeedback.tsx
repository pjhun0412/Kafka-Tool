import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Braces, Calendar, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Copy, Download, EyeOff, Filter, HelpCircle, Layers, Play, RefreshCw, Send, Sparkles, Square, Star, Trash2, X, XCircle } from "lucide-react";
import type { BrokerSummary, ConsumedMessage, ConsumerGroupLagDetail, ConsumerGroupLagRow, ConsumerGroupSummary, ManualAvroSchema, MessageExportFormat, ServerProfile, TopicDetail, TopicSummary } from "../../../../shared/types";
import { Button, IconButton } from "../../ui";
import { DataGrid } from "../../DataGrid";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, SplitPaneState, TopicConsumeState, View } from "../../../uiTypes";
import { filterMessages } from "../../../messageFilters";
import { formatCompactNumber, formatCount, formatHeaders, formatMessagePayload, formatPercent, formatTimestamp, getEpochTitle, getPartitionColor, parseJson, previewHeaders, previewValue, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";
export type PaneToastState = { pane: "primary" | "split"; message: string; kind: "loading" | "success" | "error" } | null;

export function PaneToastView({ toast }: { toast: NonNullable<PaneToastState> }) {
  const Icon = toast.kind === "loading" ? RefreshCw : toast.kind === "success" ? CheckCircle2 : XCircle;
  return (
    <div className={`pane-local-toast ${toast.kind}`}>
      <Icon size={14} className={toast.kind === "loading" ? "spin" : ""} />
      <span>{toast.message}</span>
    </div>
  );
}
