import React, { useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, X } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
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
  type OnChangeFn,
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
  let firstValue: unknown;
  for (const row of data) {
    const value = column.accessorFn?.(row, 0) ?? (row as Record<string, unknown>)[column.id];
    if (value !== null && value !== undefined && value !== "") {
      firstValue = value;
      break;
    }
  }
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
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onRowClick?: (row: TData) => void;
  onRowDoubleClick?: (row: TData) => void;
}) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = props.sorting ?? internalSorting;
  const setSorting = props.onSortingChange ?? setInternalSorting;
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [openFilterColumnId, setOpenFilterColumnId] = useState("");
  const scrollParentRef = useRef<HTMLDivElement | null>(null);
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
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollParentRef.current,
    estimateSize: () => 35,
    overscan: 12,
    observeElementRect: (instance, callback) => {
      const element = instance.scrollElement;
      const targetWindow = instance.targetWindow;
      if (!element || !targetWindow) return;

      let animationFrame = 0;
      const notify = () => {
        const rect = element.getBoundingClientRect();
        callback({ width: Math.round(rect.width), height: Math.round(rect.height) });
        animationFrame = 0;
      };
      notify();

      if (!targetWindow.ResizeObserver) return () => undefined;

      const observer = new targetWindow.ResizeObserver(() => {
        if (!animationFrame) {
          animationFrame = targetWindow.requestAnimationFrame(notify);
        }
      });
      observer.observe(element);

      return () => {
        if (animationFrame) targetWindow.cancelAnimationFrame(animationFrame);
        observer.disconnect();
      };
    }
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const topPadding = virtualRows[0]?.start ?? 0;
  const bottomPadding = Math.max(
    0,
    rowVirtualizer.getTotalSize() - (virtualRows[virtualRows.length - 1]?.end ?? 0)
  );

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
    <div ref={scrollParentRef} className={props.className ? `message-table ${props.className}` : "message-table"}>
      <table style={{ tableLayout: "fixed", width: "100%" }}>
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
                            {header.column.getCanSort() ? (
                              <button
                                className="grid-header-button sortable"
                                onClick={header.column.getToggleSortingHandler()}
                                title="Sort column"
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                <span className={sorted ? "sort-indicator active" : "sort-indicator"}>
                                  <SortIndicator sorted={sorted} />
                                </span>
                              </button>
                            ) : (
                              <div className="grid-header-button">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                              </div>
                            )}
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
          {topPadding > 0 && (
            <tr className="grid-virtual-spacer" aria-hidden="true">
              <td colSpan={table.getAllLeafColumns().length} style={{ height: topPadding }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <tr
                key={props.getRowKey ? props.getRowKey(row.original, row.index) : row.id}
                className={props.getRowClassName?.(row.original)}
                style={props.getRowStyle?.(row.original)}
                onClick={() => props.onRowClick?.(row.original)}
                onDoubleClick={() => props.onRowDoubleClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      width: cell.column.getSize(),
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {bottomPadding > 0 && (
            <tr className="grid-virtual-spacer" aria-hidden="true">
              <td colSpan={table.getAllLeafColumns().length} style={{ height: bottomPadding }} />
            </tr>
          )}
        </tbody>
      </table>
      {rows.length === 0 && <div className="empty-list">{props.emptyText}</div>}
    </div>
  );
}
