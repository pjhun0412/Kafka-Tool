import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { Column, Row } from "@tanstack/react-table";

export type GridFilterValue =
  | string
  | {
      kind: "numberRange" | "dateRange";
      min: string;
      max: string;
    };

export type GridFilterVariant = "text" | "numberRange" | "dateRange";

export function smartFilter<TData extends object>(row: Row<TData>, columnId: string, filterValue: GridFilterValue) {
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

export function isRangeFilterValue(value: unknown): value is Extract<GridFilterValue, object> {
  return Boolean(value && typeof value === "object" && "kind" in value);
}

export function getFilterVariant<TData extends object>(column: Column<TData, unknown>, data: TData[]): GridFilterVariant {
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

export function hasFilterValue(value: unknown) {
  if (isRangeFilterValue(value)) return Boolean(value.min || value.max);
  return String(value ?? "").trim().length > 0;
}

export function SortIndicator(props: { sorted: false | "asc" | "desc" }) {
  if (props.sorted === "asc") return <ArrowUp size={12} />;
  if (props.sorted === "desc") return <ArrowDown size={12} />;
  return <ArrowUpDown size={12} />;
}
