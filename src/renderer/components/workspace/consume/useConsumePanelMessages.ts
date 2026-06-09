import { useMemo } from "react";
import type { ConsumedMessage } from "../../../../shared/types";
import { OFFSET_PAGING_THRESHOLD } from "../../../consumeConfig";
import { filterMessages } from "../../../messageFilters";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, TopicConsumeState } from "../../../uiTypes";
import { formatMessagePayload } from "../../../utils";
import { useMessageGridRows } from "./MessageGrid";

export function useConsumePanelMessages(params: {
  messages: ConsumedMessage[];
  selectedMessage: ConsumedMessage | null;
  mode: ConsumeMode;
  limit: number;
  filterText: string;
  filterField: ConsumeFilterField;
  filterMode: ConsumeFilterMode;
  offsetPagination: TopicConsumeState["offsetPagination"];
}) {
  const selectedPayload = useMemo(
    () => (params.selectedMessage ? formatMessagePayload(params.selectedMessage) : null),
    [params.selectedMessage]
  );
  const selectedJson = useMemo(
    () => (selectedPayload ? JSON.stringify(selectedPayload, null, 2) : ""),
    [selectedPayload]
  );
  const filteredMessages = useMemo(
    () => filterMessages(params.messages, params.filterText, params.filterField),
    [params.filterField, params.filterText, params.messages]
  );
  const hasActiveMessageFilter = params.filterText.trim().length > 0 || params.filterField === "headersEmpty";
  const {
    rows: gridRows,
    highlightedMessageKeys,
    selectedMessageKey
  } = useMessageGridRows({
    messages: params.messages,
    filteredMessages,
    filterMode: params.filterMode,
    hasActiveMessageFilter,
    selectedMessage: params.selectedMessage
  });
  const isLargeOffsetRequest = params.mode === "offset" && params.limit > OFFSET_PAGING_THRESHOLD;
  const pagination = params.offsetPagination;
  const canExportFullOffsetRange = isLargeOffsetRequest && Boolean(pagination?.endOffsetExclusive);

  return {
    selectedPayload,
    selectedJson,
    filteredMessages,
    hasActiveMessageFilter,
    gridRows,
    highlightedMessageKeys,
    selectedMessageKey,
    isLargeOffsetRequest,
    pagination,
    canExportFullOffsetRange
  };
}
