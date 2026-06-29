import { memo, useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ConsumedMessage } from "../../../../shared/types";
import type { ConsumeFilterMode, MessagePayloadFormat, MessagePreviewEncoding } from "../../../uiTypes";
import { getMessageValuePayload, normalizeValueColumnPaths, readValuePath } from "../../../consumeValuePaths";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { getGridPayloadPreview } from "../../../messagePreview";
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

function formatValueColumnHeader(path: string) {
  const segments = path.split(".").filter(Boolean);
  const leaf = segments.at(-1) ?? path;
  const parent = segments.at(-2) ?? "";
  return parent ? `${leaf} (...${parent})` : leaf;
}

const messageGridRowCache = new WeakMap<ConsumedMessage, { formatKey: string; row: MessageGridRow }>();
function getGridRowFormatKey(formats: {
  keyFormat: Extract<MessagePayloadFormat, "text" | "hex" | "base64">;
  valueFormat: MessagePayloadFormat;
  payloadEncoding: MessagePreviewEncoding;
}) {
  return `${formats.keyFormat}:${formats.valueFormat}:${formats.payloadEncoding}`;
}

export function createMessageGridRow(
  message: ConsumedMessage,
  formats: {
    keyFormat: Extract<MessagePayloadFormat, "text" | "hex" | "base64">;
    valueFormat: MessagePayloadFormat;
    payloadEncoding: MessagePreviewEncoding;
  }
): MessageGridRow {
  const formatKey = getGridRowFormatKey(formats);
  const cached = messageGridRowCache.get(message);
  if (cached?.formatKey === formatKey) return cached.row;

  const hasDecodedValue = message.decoded?.value !== undefined;
  const keyText = getGridPayloadPreview(message, "key", formats.keyFormat, formats.payloadEncoding) || "-";
  const valueText = getGridPayloadPreview(message, "value", formats.valueFormat, formats.payloadEncoding);
  const decodedError = message.decoded?.error ?? "";
  const row = {
    message,
    rowKey: getMessageRowKey(message),
    partition: message.partition,
    offset: message.offset,
    timestampRaw: message.timestamp,
    timestampLabel: formatTimestamp(message.timestamp),
    keyText,
    headersText: formatHeaders(message.headers),
    headersPreview: previewHeaders(message.headers),
    valueText,
    valuePreview: previewValue(valueText),
    valueTitle: decodedError || valueText,
    hasDecodedValue,
    decodedError
  };
  messageGridRowCache.set(message, { formatKey, row });
  return row;
}

export function useMessageGridRows(params: {
  messages: ConsumedMessage[];
  filteredMessages: ConsumedMessage[];
  filterMode: ConsumeFilterMode;
  hasActiveMessageFilter: boolean;
  selectedMessage: ConsumedMessage | null;
  keyFormat: Extract<MessagePayloadFormat, "text" | "hex" | "base64">;
  valueFormat: MessagePayloadFormat;
  payloadEncoding: MessagePreviewEncoding;
}) {
  const formats = useMemo(
    () => ({
      keyFormat: params.keyFormat,
      valueFormat: params.valueFormat,
      payloadEncoding: params.payloadEncoding
    }),
    [params.keyFormat, params.payloadEncoding, params.valueFormat]
  );
  const messageRows = useMemo(
    () => params.messages.map((message) => createMessageGridRow(message, formats)),
    [formats, params.messages]
  );
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
    return params.filteredMessages.map((message) => messageRowsByKey.get(getMessageRowKey(message)) ?? createMessageGridRow(message, formats));
  }, [formats, messageRows, messageRowsByKey, params.filterMode, params.filteredMessages, params.hasActiveMessageFilter]);
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
  valueColumnPaths: string[];
  selectedMessageKey: string;
  checkedMessageKeys: Set<string>;
  filterMode: ConsumeFilterMode;
  hasActiveMessageFilter: boolean;
  highlightedMessageKeys: Set<string>;
  onSelectMessage: (message: ConsumedMessage) => void;
  onToggleMessageChecked: (message: ConsumedMessage) => void;
  onToggleVisibleChecked: (messages: ConsumedMessage[], checked: boolean) => void;
}) {
  const language = useAppLanguage();
  const {
    checkedMessageKeys,
    filterMode,
    hasActiveMessageFilter,
    highlightedMessageKeys,
    onSelectMessage,
    onToggleMessageChecked,
    onToggleVisibleChecked,
    rows,
    selectedMessageKey,
    valueColumnPaths
  } = props;
  const visibleMessages = useMemo(() => rows.map((row) => row.message), [rows]);
  const checkedVisibleCount = useMemo(
    () => rows.filter((row) => checkedMessageKeys.has(row.rowKey)).length,
    [checkedMessageKeys, rows]
  );
  const allVisibleChecked = rows.length > 0 && checkedVisibleCount === rows.length;
  const partlyVisibleChecked = checkedVisibleCount > 0 && !allVisibleChecked;
  const getRowClassName = useCallback((row: MessageGridRow) => {
    const classes = [];
    if (selectedMessageKey === row.rowKey) classes.push("selected");
    if (checkedMessageKeys.has(row.rowKey)) classes.push("checked");
    if (filterMode === "highlight" && hasActiveMessageFilter) {
      const isMatched = highlightedMessageKeys.has(row.rowKey);
      classes.push(isMatched ? "filter-highlight" : "filter-muted");
    }
    return classes.join(" ");
  }, [checkedMessageKeys, filterMode, hasActiveMessageFilter, highlightedMessageKeys, selectedMessageKey]);

  const handleRowClick = useCallback((row: MessageGridRow) => {
    onSelectMessage(row.message);
  }, [onSelectMessage]);

  const columns = useMemo<ColumnDef<MessageGridRow>[]>(() => {
    const selectColumn: ColumnDef<MessageGridRow> = {
      id: "select",
      header: () => (
        <input
          type="checkbox"
          checked={allVisibleChecked}
          ref={(input) => {
            if (input) input.indeterminate = partlyVisibleChecked;
          }}
          title={t(language, "replay.selectVisible")}
          onChange={(event) => onToggleVisibleChecked(visibleMessages, event.target.checked)}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 36,
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={checkedMessageKeys.has(row.original.rowKey)}
          title={t(language, "replay.selectMessage")}
          onChange={() => onToggleMessageChecked(row.original.message)}
        />
      )
    };
    const normalizedValueColumnPaths = normalizeValueColumnPaths(valueColumnPaths);
    if (normalizedValueColumnPaths.length === 0) return [selectColumn, ...messageGridColumns];
    const valueColumns: ColumnDef<MessageGridRow>[] = normalizedValueColumnPaths.map((path) => ({
      id: `value.${path}`,
      header: () => <span className="value-column-header" title={path}>{formatValueColumnHeader(path)}</span>,
      accessorFn: (row) => readValuePath(getMessageValuePayload(row.message), path),
      cell: ({ getValue }) => {
        const value = String(getValue() ?? "");
        return <span title={value}>{value || "-"}</span>;
      },
      size: 170
    }));
    return [selectColumn, ...messageGridColumns.slice(0, -1), ...valueColumns, messageGridColumns[messageGridColumns.length - 1]];
  }, [allVisibleChecked, checkedMessageKeys, language, onToggleMessageChecked, onToggleVisibleChecked, partlyVisibleChecked, valueColumnPaths, visibleMessages]);

  return (
    <DataGrid
      data={rows}
      columns={columns}
      className="tanstack-message-table"
      emptyText={t(language, "label.noMessages")}
      getRowKey={(row) => row.rowKey}
      getRowClassName={getRowClassName}
      keyboardNavigation={{
        selectedKey: selectedMessageKey,
        onSelectRow: handleRowClick
      }}
      onRowClick={handleRowClick}
    />
  );
});
