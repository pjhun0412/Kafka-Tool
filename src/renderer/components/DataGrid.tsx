import React, { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from "@tanstack/react-table";

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
  const table = useReactTable({
    data: props.data,
    columns: props.columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className={props.className ? `message-table ${props.className}` : "message-table"}>
      <table>
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <button
                        className={header.column.getCanSort() ? "grid-header-button sortable" : "grid-header-button"}
                        onClick={header.column.getToggleSortingHandler()}
                        disabled={!header.column.getCanSort()}
                        title={header.column.getCanSort() ? "Sort column" : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className={sorted ? "sort-indicator active" : "sort-indicator"}>
                            {sorted === "asc" ? "↑" : sorted === "desc" ? "↓" : <ArrowUpDown size={12} />}
                          </span>
                        )}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
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
      {props.data.length === 0 && <div className="empty-list">{props.emptyText}</div>}
    </div>
  );
}
