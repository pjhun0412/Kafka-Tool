import React, { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState
} from "@tanstack/react-table";
import { smartFilter } from "./DataGridFiltering";
import { DataGridHeader } from "./DataGridHeader";

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
  keyboardNavigation?: {
    selectedKey: string;
    onSelectRow: (row: TData) => void;
  };
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
  const getResolvedRowKey = (row: TData, index: number) => props.getRowKey ? props.getRowKey(row, index) : String(index);

  function selectRow(row: TData) {
    if (props.keyboardNavigation) {
      props.keyboardNavigation.onSelectRow(row);
      return;
    }
    props.onRowClick?.(row);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!props.keyboardNavigation || rows.length === 0) return;
    const selectedIndex = rows.findIndex((row) => getResolvedRowKey(row.original, row.index) === props.keyboardNavigation?.selectedKey);
    const currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") {
      nextIndex = Math.min(rows.length - 1, currentIndex + 1);
    } else if (event.key === "ArrowUp") {
      nextIndex = Math.max(0, currentIndex - 1);
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = rows.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    if (nextIndex === selectedIndex) return;
    rowVirtualizer.scrollToIndex(nextIndex, { align: "center" });
    props.keyboardNavigation.onSelectRow(rows[nextIndex].original);
  }

  return (
    <div
      ref={scrollParentRef}
      className={props.className ? `message-table ${props.className}` : "message-table"}
      tabIndex={props.keyboardNavigation ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <table style={{ tableLayout: "fixed", width: "100%" }}>
        <DataGridHeader
          table={table}
          data={props.data}
          openFilterColumnId={openFilterColumnId}
          onOpenFilterColumnId={setOpenFilterColumnId}
        />
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
                onClick={() => {
                  scrollParentRef.current?.focus();
                  selectRow(row.original);
                }}
                onDoubleClick={() => props.onRowDoubleClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => {
                  const isRowActionCell = cell.column.id === "check" || cell.column.id === "select" || cell.column.id === "favorite";
                  return (
                    <td
                      key={cell.id}
                      className={isRowActionCell ? "grid-row-action-cell" : undefined}
                      onClick={isRowActionCell ? (event) => event.stopPropagation() : undefined}
                      onDoubleClick={isRowActionCell ? (event) => event.stopPropagation() : undefined}
                      style={{
                        width: cell.column.getSize(),
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
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
