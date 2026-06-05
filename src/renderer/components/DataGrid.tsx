import React, { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type Header,
  type Row,
  type SortingState
} from "@tanstack/react-table";

type GridFilterValue =
  | string
  | {
      kind: "numberRange" | "dateRange";
      min: string;
      max: string;
    };

type GridFilterVariant = "text" | "numberRange" | "dateRange";

function smartFilter<TData extends object>(row: Row<TData>, columnId: string, filterValue: GridFilterValue) {
  const value = row.getValue<unknown>(columnId);
  if (typeof filterValue === "object") {
    const comparable = filterValue.kind === "dateRange" ? Date.parse(String(value)) : Number(value);
    if (!Number.isFinite(comparable)) return false;
    const min = filterValue.min ? (filterValue.kind === "dateRange" ? Date.parse(filterValue.min) : Number(filterValue.min)) : NaN;
    const max = filterValue.max ? (filterValue.kind === "dateRange" ? Date.parse(filterValue.max) : Number(filterValue.max)) : NaN;
    if (Number.isFinite(min) && comparable < min) return false;
    if (Number.isFinite(max) && comparable > max) return false;
    return true;
  }
  const query = String(filterValue ?? "").trim().toLowerCase();
  if (!query) return true;
  return String(value ?? "").toLowerCase().includes(query);
}

function isRangeFilterValue(value: unknown): value is Extract<GridFilterValue, object> {
  return Boolean(value && typeof value === "object" && "kind" in value);
}

function getFilterVariant<TData extends object>(column: Column<TData, unknown>, data: TData[]): GridFilterVariant {
  const columnId = column.id.toLowerCase();
  if (columnId.includes("timestamp") || columnId.includes("date") || columnId.includes("time")) return "dateRange";
  const firstValue = data
    .map((row) => column.accessorFn?.(row, 0) ?? (row as Record<string, unknown>)[column.id])
    .find((value) => value !== null && value !== undefined && value !== "");
  if (typeof firstValue === "number" || typeof firstValue === "bigint") return "numberRange";
  if (
    typeof firstValue === "string" &&
    firstValue.trim() !== "" &&
    /^-?\d+(\.\d+)?$/.test(firstValue.trim()) &&
    (columnId.includes("offset") ||
      columnId.includes("partition") ||
      columnId.includes("count") ||
      columnId.includes("lag") ||
      columnId.includes("id"))
  ) {
    return "numberRange";
  }
  return "text";
}

function hasFilterValue(value: unknown) {
  if (isRangeFilterValue(value)) return Boolean(value.min || value.max);
  return String(value ?? "").trim().length > 0;
}

function SortIndicator(props: { sorted: false | "asc" | "desc" }) {
  if (props.sorted === "asc") return <ArrowUp size={12} />;
  if (props.sorted === "desc") return <ArrowDown size={12} />;
  return <ArrowUpDown size={12} />;
}

export function DataGrid<TData extends object>(props: {
  data: TData[];
  columns: ColumnDef<TData>[];
  className?: string;
  emptyText: string;
  getRowKey?: (row: TData, index: number) => string;
  getRowClassName?: (row: TData) => string;
  getRowStyle?: (row: TData) => React.CSSProperties;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [openFilterColumnId, setOpenFilterColumnId] = useState("");
  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    defaultColumn: {
      filterFn: smartFilter
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel()
  });
  const rows = table.getRowModel().rows;

  function openColumnFilter(header: Header<TData, unknown>) {
    const variant = getFilterVariant(header.column, props.data);
    const currentValue = header.column.getFilterValue();
    if (variant !== "text" && !isRangeFilterValue(currentValue)) {
      header.column.setFilterValue({ kind: variant, min: "", max: "" });
    }
    setOpenFilterColumnId((current) => (current === header.column.id ? "" : header.column.id));
  }

  function renderFilterEditor(header: Header<TData, unknown>) {
    const variant = getFilterVariant(header.column, props.data);
    const rawFilterValue = header.column.getFilterValue();
    const filterValue = isRangeFilterValue(rawFilterValue) ? rawFilterValue : String(rawFilterValue ?? "");
    if (variant === "text") {
      return (
        <input
          autoFocus
          value={String(filterValue)}
          onChange={(event) => header.column.setFilterValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpenFilterColumnId("");
          }}
          placeholder="Contains"
        />
      );
    }
    const rangeValue = isRangeFilterValue(filterValue) ? filterValue : { kind: variant, min: "", max: "" };
    return (
      <div className="grid-range-filter">
        <input
          autoFocus
          type={variant === "dateRange" ? "datetime-local" : "number"}
          value={rangeValue.min}
          onChange={(event) => header.column.setFilterValue({ kind: variant, min: event.target.value, max: rangeValue.max })}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpenFilterColumnId("");
          }}
          placeholder="Min"
        />
        <span>~</span>
        <input
          type={variant === "dateRange" ? "datetime-local" : "number"}
          value={rangeValue.max}
          onChange={(event) => header.column.setFilterValue({ kind: variant, min: rangeValue.min, max: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpenFilterColumnId("");
          }}
          placeholder="Max"
        />
      </div>
    );
  }

  return (
    <div className={props.className ? `message-table ${props.className}` : "message-table"}>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => {
            const activeHeader = headerGroup.headers.find((header) => header.column.id === openFilterColumnId);
            return (
              <React.Fragment key={headerGroup.id}>
                <tr>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const canFilter = header.column.getCanFilter();
                    const rawFilterValue = header.column.getFilterValue();
                    const filterActive = hasFilterValue(rawFilterValue);
                    const isFilterOpen = openFilterColumnId === header.column.id;
                    return (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div className="grid-header-cell">
                            <button
                              className={header.column.getCanSort() ? "grid-header-button sortable" : "grid-header-button"}
                              onClick={header.column.getToggleSortingHandler()}
                              disabled={!header.column.getCanSort()}
                              title={header.column.getCanSort() ? "Sort column" : undefined}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className={sorted ? "sort-indicator active" : "sort-indicator"}>
                                  <SortIndicator sorted={sorted} />
                                </span>
                              )}
                            </button>
                            {canFilter && (
                              <button
                                className={filterActive || isFilterOpen ? "grid-filter-button active" : "grid-filter-button"}
                                type="button"
                                title="Filter column"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openColumnFilter(header);
                                }}
                              >
                                <Filter size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </th>
                    );
                  })}
                </tr>
                {activeHeader && (
                  <tr className="grid-filter-panel-row">
                    <th colSpan={headerGroup.headers.length}>
                      <div className="grid-filter-panel">
                        <span>
                          Filter
                          <strong>{flexRender(activeHeader.column.columnDef.header, activeHeader.getContext())}</strong>
                        </span>
                        {renderFilterEditor(activeHeader)}
                        {hasFilterValue(activeHeader.column.getFilterValue()) && (
                          <button type="button" title="Clear column filter" onClick={() => activeHeader.column.setFilterValue("")}>
                            Clear
                          </button>
                        )}
                        <button type="button" title="Close filter" onClick={() => setOpenFilterColumnId("")}>
                          <X size={14} />
                        </button>
                      </div>
                    </th>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={props.getRowKey ? props.getRowKey(row.original, row.index) : row.id}
              className={props.getRowClassName?.(row.original)}
              style={props.getRowStyle?.(row.original)}
              onClick={() => props.onRowClick?.(row.original)}
              onDoubleClick={() => props.onRowDoubleClick?.(row.original)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-list">{props.emptyText}</div>}
    </div>
  );
}
