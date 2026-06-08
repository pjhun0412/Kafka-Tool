import React from "react";
import { Filter, X } from "lucide-react";
import { flexRender, type Header, type Table } from "@tanstack/react-table";
import { getFilterVariant, hasFilterValue, isRangeFilterValue, SortIndicator } from "./DataGridFiltering";

export function DataGridHeader<TData extends object>(props: {
  table: Table<TData>;
  data: TData[];
  openFilterColumnId: string;
  onOpenFilterColumnId: React.Dispatch<React.SetStateAction<string>>;
}) {
  function openColumnFilter(header: Header<TData, unknown>) {
    const variant = getFilterVariant(header.column, props.data);
    const currentValue = header.column.getFilterValue();
    if (variant !== "text" && !isRangeFilterValue(currentValue)) {
      header.column.setFilterValue({ kind: variant, min: "", max: "" });
    }
    props.onOpenFilterColumnId((current) => (current === header.column.id ? "" : header.column.id));
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
            if (event.key === "Escape") props.onOpenFilterColumnId("");
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
            if (event.key === "Escape") props.onOpenFilterColumnId("");
          }}
          placeholder="Min"
        />
        <span>~</span>
        <input
          type={variant === "dateRange" ? "datetime-local" : "number"}
          value={rangeValue.max}
          onChange={(event) => header.column.setFilterValue({ kind: variant, min: rangeValue.min, max: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Escape") props.onOpenFilterColumnId("");
          }}
          placeholder="Max"
        />
      </div>
    );
  }

  return (
    <thead>
      {props.table.getHeaderGroups().map((headerGroup) => {
        const activeHeader = headerGroup.headers.find((header) => header.column.id === props.openFilterColumnId);
        return (
          <React.Fragment key={headerGroup.id}>
            <tr>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const canFilter = header.column.getCanFilter();
                const rawFilterValue = header.column.getFilterValue();
                const filterActive = hasFilterValue(rawFilterValue);
                const isFilterOpen = props.openFilterColumnId === header.column.id;
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
                    <button type="button" title="Close filter" onClick={() => props.onOpenFilterColumnId("")}>
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
  );
}
