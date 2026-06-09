import type { ConsumedMessage } from "../shared/types";
import type { ConsumeDefaultPatch, OffsetOrder, TopicConsumeState } from "./uiTypes";

export const OFFSET_PAGING_THRESHOLD = 10000;
export const OFFSET_PAGE_SIZE = 5000;

export function toLocalDateTimeInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getDefaultTimeRangeValues(state: Pick<TopicConsumeState, "timeStart" | "timeEnd">) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return {
    timeStart: state.timeStart || toLocalDateTimeInputValue(startOfToday),
    timeEnd: state.timeEnd || toLocalDateTimeInputValue(now)
  };
}

export function getOffsetPageLimit(state: Pick<TopicConsumeState, "limit">, pageIndex: number) {
  if (state.limit <= OFFSET_PAGING_THRESHOLD) return state.limit;
  return Math.min(OFFSET_PAGE_SIZE, Math.max(0, state.limit - pageIndex * OFFSET_PAGE_SIZE));
}

export function getNextPageOffset(order: OffsetOrder, messages: Pick<ConsumedMessage, "offset">[]) {
  if (messages.length === 0) return "";
  const anchor = messages[messages.length - 1].offset;
  return order === "desc" ? anchor : String(/^\d+$/.test(anchor) ? BigInt(anchor) + 1n : anchor);
}

export function buildOffsetPagination(params: {
  state: Pick<TopicConsumeState, "limit" | "offsetOrder">;
  pageIndex: number;
  pageLimit: number;
  pageOffset: string;
  prevOffsets: string[];
  messages: Pick<ConsumedMessage, "offset">[];
  endOffsetExclusive?: string;
}) {
  if (params.state.limit <= OFFSET_PAGING_THRESHOLD) return null;
  return {
    totalLimit: params.state.limit,
    pageSize: OFFSET_PAGE_SIZE,
    pageIndex: params.pageIndex,
    currentOffset: params.pageOffset,
    prevOffsets: params.prevOffsets,
    nextOffset: getNextPageOffset(params.state.offsetOrder, params.messages),
    hasNext: params.messages.length === params.pageLimit && (params.pageIndex + 1) * OFFSET_PAGE_SIZE < params.state.limit,
    endOffsetExclusive: params.endOffsetExclusive
  };
}

export function toConsumeDefaultPatch(patch: Partial<TopicConsumeState>): ConsumeDefaultPatch {
  return {
    mode: patch.mode,
    limit: patch.limit,
    partition: patch.partition,
    filterField: patch.filterField,
    autoScroll: patch.autoScroll,
    maxMessages: patch.maxMessages,
    offsetOrder: patch.offsetOrder
  };
}
