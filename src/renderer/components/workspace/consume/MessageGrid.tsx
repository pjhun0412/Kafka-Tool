import { memo, useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ConsumedMessage } from "../../../../shared/types";
import type { ConsumeFilterMode } from "../../../uiTypes";
import { formatHeaders, formatTimestamp, previewHeaders, previewValue } from "../../../utils";
import { DataGrid } from "../../DataGrid";

export type MessageGridRow = {
  message: ConsumedMessage;
  rowKey: string;
  partition: number;
  offset: string;
  timestampRaw: string;
  timestampLabel: string;
  keyText: string;
  headersText: string;
  headersPreview: string;
  valueText: string;
  valuePreview: string;
  valueTitle: string;
  hasDecodedValue: boolean;
  decodedError: string;
};

export function getMessageRowKey(message: ConsumedMessage) {
  return `${message.partition}-${message.offset}-${message.timestamp}`;
}

export function createMessageGridRow(message: ConsumedMessage): MessageGridRow {
  const hasDecodedValue = message.decoded?.value !== undefined;
  const valueText = hasDecodedValue ? JSON.stringify(message.decoded?.value) : message.value;
  const decodedError = message.decoded?.error ?? "";
  return {
    message,
    rowKey: getMessageRowKey(message),
    partition: message.partition,
    offset: message.offset,
    timestampRaw: message.timestamp,
    timestampLabel: formatTimestamp(message.timestamp),
    keyText: message.key || "-",
    headersText: formatHeaders(message.headers),
    headersPreview: previewHeaders(message.headers),
    valueText,
    valuePreview: previewValue(valueText),
    valueTitle: decodedError || valueText,
    hasDecodedValue,
    decodedError
  };
}

export function useMessageGridRows(params: {
  messages: ConsumedMessage[];
  filteredMessages: ConsumedMessage[];
  filterMode: ConsumeFilterMode;
  hasActiveMessageFilter: boolean;
  selectedMessage: ConsumedMessage | null;
}) {
  const messageRows = useMemo(() => params.messages.map(createMessageGridRow), [params.messages]);
  const messageRowsByKey = useMemo(
    () => new Map(messageRows.map((row) => [row.rowKey, row])),
    [messageRows]
  );
  const highlightedMessageKeys = useMemo(
    () => new Set(params.filteredMessages.map(getMessageRowKey)),
    [params.filteredMessages]
  );
  const rows = useMemo(() => {
    if (params.filterMode === "highlight" && params.hasActiveMessageFilter) return messageRows;
    return params.filteredMessages.map((message) => messageRowsByKey.get(getMessageRowKey(message)) ?? createMessageGridRow(message));
  }, [messageRows, messageRowsByKey, params.filterMode, params.filteredMessages, params.hasActiveMessageFilter]);
  const selectedMessageKey = params.selectedMessage ? getMessageRowKey(params.selectedMessage) : "";

  return {
    rows,
    highlightedMessageKeys,
    selectedMessageKey
  };
}

const messageGridColumns: ColumnDef<MessageGridRow>[] = [
  {
    id: "no",
    header: "No",
    enableSorting: false,
    cell: ({ row }) => row.index + 1
  },
  {
    accessorKey: "partition",
    header: "Partition",
    sortingFn: "basic",
    cell: ({ row }) => (
      <span className="partition-badge">
        {row.original.partition}
      </span>
    )
  },
  {
    accessorKey: "offset",
    header: "Offset",
    sortingFn: (left, right, columnId) => Number(left.getValue(columnId)) - Number(right.getValue(columnId)),
    cell: ({ row }) => <span title={row.original.offset}>{row.original.offset}</span>
  },
  {
    accessorKey: "timestampRaw",
    header: "Timestamp",
    sortingFn: (left, right, columnId) => Date.parse(String(left.getValue(columnId))) - Date.parse(String(right.getValue(columnId))),
    cell: ({ row }) => <span title={row.original.timestampRaw}>{row.original.timestampLabel}</span>
  },
  {
    accessorKey: "keyText",
    header: "Key",
    cell: ({ row }) => <span title={row.original.keyText}>{row.original.keyText}</span>
  },
  {
    accessorKey: "headersText",
    header: "Headers",
    cell: ({ row }) => <span title={row.original.headersText}>{row.original.headersPreview}</span>
  },
  {
    accessorKey: "valueText",
    header: "Value",
    cell: ({ row }) => (
      <span title={row.original.valueTitle}>
        {row.original.hasDecodedValue && <span className="decode-badge">Avro</span>}
        {row.original.decodedError && <span className="decode-badge error">Avro error</span>}
        {row.original.valuePreview}
      </span>
    )
  }
];

export const MessageGrid = memo(function MessageGrid(props: {
  rows: MessageGridRow[];
  selectedMessageKey: string;
  filterMode: ConsumeFilterMode;
  hasActiveMessageFilter: boolean;
  highlightedMessageKeys: Set<string>;
  onSelectMessage: (message: ConsumedMessage) => void;
}) {
  const getRowClassName = useCallback((row: MessageGridRow) => {
    const classes = [];
    if (props.selectedMessageKey === row.rowKey) classes.push("selected");
    if (props.filterMode === "highlight" && props.hasActiveMessageFilter) {
      const isMatched = props.highlightedMessageKeys.has(row.rowKey);
      classes.push(isMatched ? "filter-highlight" : "filter-muted");
    }
    return classes.join(" ");
  }, [props.filterMode, props.hasActiveMessageFilter, props.highlightedMessageKeys, props.selectedMessageKey]);

  const handleRowClick = useCallback((row: MessageGridRow) => {
    props.onSelectMessage(row.message);
  }, [props.onSelectMessage]);

  return (
    <DataGrid
      data={props.rows}
      columns={messageGridColumns}
      className="tanstack-message-table"
      emptyText="No messages"
      getRowKey={(row) => row.rowKey}
      getRowClassName={getRowClassName}
      onRowClick={handleRowClick}
    />
  );
});
