import { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, RefreshCw, RotateCcw, ShieldAlert, X } from "lucide-react";
import type { ConsumerGroupLagDetail, ConsumerGroupLagRow, ConsumerGroupOffsetResetMode, ConsumerGroupOffsetResetRequest } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t, type AppLanguage } from "../../../i18n";
import { DataGrid } from "../../DataGrid";
import { GroupStateBadge } from "./GroupStateBadge";

function groupRowsByTopic(rows: ConsumerGroupLagDetail["rows"]) {
  const grouped = new Map<string, ConsumerGroupLagDetail["rows"]>();
  for (const row of rows) {
    grouped.set(row.topic, [...(grouped.get(row.topic) ?? []), row]);
  }
  return [...grouped.entries()].map(([topic, topicRows]) => {
    const totalLag = topicRows.reduce<bigint | null>((total, row) => {
      if (!/^\d+$/.test(row.lag)) return total;
      return (total ?? 0n) + BigInt(row.lag);
    }, null);
    return {
      topic,
      rows: topicRows,
      totalLag: totalLag?.toString() ?? "-"
    };
  });
}

function isActiveConsumerGroup(detail: ConsumerGroupLagDetail) {
  const state = (detail.state ?? "").toLowerCase();
  return state === "stable" || detail.members > 0;
}

function toOffsetBigInt(value: string) {
  return /^\d+$/.test(value) ? BigInt(value) : null;
}

function formatOffsetDiff(currentOffset: string, targetOffset: string) {
  const current = toOffsetBigInt(currentOffset);
  const target = toOffsetBigInt(targetOffset);
  if (current === null || target === null) return "-";
  const diff = target - current;
  return diff > 0n ? `+${diff.toString()}` : diff.toString();
}

function getResetTargetOffset(row: ConsumerGroupLagRow, mode: ConsumerGroupOffsetResetMode, specificOffset: string, language: AppLanguage) {
  if (mode === "earliest") return row.startOffset ?? "0";
  if (mode === "latest") return row.endOffset;
  if (mode === "specific") return specificOffset.trim();
  return t(language, "consumerReset.applyTimeLookup");
}

function ResetPartitionCheckbox(props: {
  checked: boolean;
  indeterminate?: boolean;
  title: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(props.indeterminate);
  }, [props.indeterminate]);

  return <input ref={ref} type="checkbox" checked={props.checked} title={props.title} onChange={props.onChange} />;
}

function ConsumerGroupResetOffsetsDialog(props: {
  serverId: string;
  detail: ConsumerGroupLagDetail;
  onClose: () => void;
  onRefreshDetail: () => void;
  onResetOffsets: (request: ConsumerGroupOffsetResetRequest) => Promise<void>;
}) {
  const language = useAppLanguage();
  const groupedTopics = useMemo(() => groupRowsByTopic(props.detail.rows), [props.detail.rows]);
  const [topic, setTopic] = useState(groupedTopics[0]?.topic ?? "");
  const [selectedPartitions, setSelectedPartitions] = useState<number[]>(() => groupedTopics[0]?.rows.map((row) => row.partition) ?? []);
  const [mode, setMode] = useState<ConsumerGroupOffsetResetMode>("latest");
  const [timestamp, setTimestamp] = useState("");
  const [specificOffset, setSpecificOffset] = useState("");
  const [dryRunReady, setDryRunReady] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const activeGroup = isActiveConsumerGroup(props.detail);
  const topicRows = groupedTopics.find((item) => item.topic === topic)?.rows ?? [];
  const selectedRows = topicRows.filter((row) => selectedPartitions.includes(row.partition));
  const allSelected = topicRows.length > 0 && selectedRows.length === topicRows.length;
  const partlySelected = selectedRows.length > 0 && !allSelected;
  const specificOffsetValid = mode !== "specific" || /^\d+$/.test(specificOffset.trim());
  const timestampMs = timestamp ? new Date(timestamp).getTime() : NaN;
  const timestampValid = mode !== "timestamp" || Number.isFinite(timestampMs);
  const canDryRun = selectedRows.length > 0 && specificOffsetValid && timestampValid;
  const hasResetHandler = typeof props.onResetOffsets === "function";
  const canApply = hasResetHandler && dryRunReady && canDryRun && !activeGroup && confirmText === "RESET" && !isApplying;
  const applyDisabledReason = !hasResetHandler
    ? t(language, "consumerReset.reasonUnavailable")
    : activeGroup
      ? t(language, "consumerReset.reasonActive")
      : !dryRunReady
        ? t(language, "consumerReset.reasonPreview")
        : !canDryRun
          ? t(language, "consumerReset.reasonInvalid")
          : confirmText !== "RESET"
            ? t(language, "consumerReset.reasonConfirm")
            : "";

  function selectTopic(nextTopic: string) {
    const nextRows = groupedTopics.find((item) => item.topic === nextTopic)?.rows ?? [];
    setTopic(nextTopic);
    setSelectedPartitions(nextRows.map((row) => row.partition));
    setDryRunReady(false);
    setConfirmText("");
    setApplyError("");
  }

  function toggleAllPartitions() {
    setDryRunReady(false);
    setConfirmText("");
    setApplyError("");
    setSelectedPartitions(allSelected ? [] : topicRows.map((row) => row.partition));
  }

  function togglePartition(partition: number) {
    setDryRunReady(false);
    setConfirmText("");
    setApplyError("");
    setSelectedPartitions((current) => current.includes(partition)
      ? current.filter((item) => item !== partition)
      : [...current, partition]);
  }

  function runDryRun() {
    if (!canDryRun) return;
    setDryRunReady(true);
    setConfirmText("");
    setApplyError("");
  }

  async function applyReset() {
    if (!canApply) {
      setApplyError(applyDisabledReason);
      return;
    }
    if (!hasResetHandler) {
      setApplyError(t(language, "consumerReset.reasonUnavailable"));
      return;
    }
    setIsApplying(true);
    setApplyError("");
    const request: ConsumerGroupOffsetResetRequest = {
      serverId: props.serverId,
      groupId: props.detail.groupId,
      topic,
      partitions: selectedRows.map((row) => row.partition),
      mode,
      timestamp: mode === "timestamp" ? timestampMs : undefined,
      offset: mode === "specific" ? specificOffset.trim() : undefined
    };
    try {
      await props.onResetOffsets(request);
      props.onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void window.kafkaApi?.logError?.({
        level: "error",
        source: "consumer-reset",
        message,
        stack: error instanceof Error ? error.stack : undefined
      });
      setApplyError(message);
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <div className="modal-backdrop reset-offset-backdrop" role="presentation" onMouseDown={() => {
      if (!isApplying) props.onClose();
    }}>
      <section className="reset-offset-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-offset-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">{props.detail.groupId}</span>
            <h2 id="reset-offset-title">{t(language, "consumerReset.title")}</h2>
          </div>
          <button className="modal-close" onClick={props.onClose} disabled={isApplying} title={t(language, "title.close")}>
            <X size={16} />
          </button>
        </div>

        {activeGroup && (
          <div className="reset-offset-warning">
            <ShieldAlert size={16} />
            <div>
              <strong>{t(language, "consumerReset.activeGroupTitle")}</strong>
              <span>{t(language, "consumerReset.activeGroupDescription")}</span>
            </div>
          </div>
        )}

        <div className="reset-offset-form">
          <label>
            <span>{t(language, "label.topic")}</span>
            <select value={topic} onChange={(event) => selectTopic(event.target.value)}>
              {groupedTopics.map((item) => (
                <option key={item.topic} value={item.topic}>{item.topic}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{t(language, "consumerReset.resetTo")}</span>
            <select value={mode} onChange={(event) => {
              setMode(event.target.value as ConsumerGroupOffsetResetMode);
              setDryRunReady(false);
              setConfirmText("");
            }}>
              <option value="earliest">Earliest</option>
              <option value="latest">Latest</option>
              <option value="timestamp">Timestamp</option>
              <option value="specific">Specific offset</option>
            </select>
          </label>
          {mode === "timestamp" && (
            <label>
              <span>Timestamp</span>
              <input type="datetime-local" value={timestamp} onChange={(event) => {
                setTimestamp(event.target.value);
                setDryRunReady(false);
              }} />
            </label>
          )}
          {mode === "specific" && (
            <label>
              <span>Offset</span>
              <input value={specificOffset} onChange={(event) => {
                setSpecificOffset(event.target.value);
                setDryRunReady(false);
              }} placeholder="0" />
            </label>
          )}
        </div>

        <div className="reset-offset-partitions">
          <div className="reset-offset-partition-header">
            <label>
              <ResetPartitionCheckbox
                checked={allSelected}
                indeterminate={partlySelected}
                title={t(language, "consumerReset.selectAllPartitions")}
                onChange={toggleAllPartitions}
              />
              <span>{t(language, "consumerReset.selectedPartitions", { selected: String(selectedRows.length), total: String(topicRows.length) })}</span>
            </label>
            <button className="ghost compact" onClick={props.onRefreshDetail}><RefreshCw size={14} /> {t(language, "label.refresh")}</button>
          </div>
          <div className="reset-offset-partition-list">
            {topicRows.map((row) => (
              <label key={`${row.topic}-${row.partition}`} className="reset-offset-partition-row">
                <input
                  type="checkbox"
                  checked={selectedPartitions.includes(row.partition)}
                  onChange={() => togglePartition(row.partition)}
                />
                <strong>p{row.partition}</strong>
                <span>{t(language, "consumerReset.current")}: {row.currentOffset}</span>
                <span>{t(language, "consumerReset.end")}: {row.endOffset}</span>
                <span className={row.lag !== "-" && row.lag !== "0" ? "lag-warn" : ""}>{t(language, "consumerReset.lag")}: {row.lag}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="reset-offset-actions">
          <button className="ghost compact" onClick={runDryRun} disabled={!canDryRun}>{t(language, "consumerReset.dryRun")}</button>
        </div>

        {dryRunReady && (
          <div className="reset-offset-preview">
            <strong>{t(language, "consumerReset.preview")}</strong>
            {mode === "timestamp" && <span className="reset-offset-preview-note">{t(language, "consumerReset.timestampPending")}</span>}
            <div className="reset-offset-preview-grid">
              <span>Partition</span>
              <span>{t(language, "consumerReset.current")}</span>
              <span>{t(language, "consumerReset.target")}</span>
              <span>Diff</span>
              {selectedRows.map((row) => {
                const target = getResetTargetOffset(row, mode, specificOffset, language);
                const diff = formatOffsetDiff(row.currentOffset, target);
                return (
                  <div className="reset-offset-preview-row" key={`${row.topic}-${row.partition}`}>
                    <span>p{row.partition}</span>
                    <span>{row.currentOffset}</span>
                    <span>{target}</span>
                    <span className={diff.startsWith("-") ? "lag-warn" : ""}>{diff}</span>
                  </div>
                );
              })}
            </div>
            <label className="reset-offset-confirm">
              <span>{t(language, "consumerReset.confirmLabel")}</span>
              <input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder="RESET" />
            </label>
          </div>
        )}

        {isApplying && (
          <div className="reset-offset-progress" role="status" aria-live="polite">
            <RefreshCw size={16} className="spin" />
            <div>
              <strong>{t(language, "consumerReset.applying")}</strong>
              <span>{t(language, "consumerReset.applyingDescription")}</span>
            </div>
          </div>
        )}

        <div className="modal-actions">
          {(applyError || (dryRunReady && applyDisabledReason)) && (
            <span className="reset-offset-apply-message">{applyError || applyDisabledReason}</span>
          )}
          <button className="ghost compact" onClick={props.onClose} disabled={isApplying}>{t(language, "action.cancel")}</button>
          <button className="danger compact" disabled={!canApply} onClick={() => { void applyReset(); }}>
            {isApplying ? t(language, "consumerReset.applying") : t(language, "consumerReset.apply")}
          </button>
        </div>
      </section>
    </div>
  );
}

export function ConsumerGroupDetailView(props: {
  detail: ConsumerGroupLagDetail;
  serverId: string;
  query: string;
  onQuery: (query: string) => void;
  onBack: () => void;
  onRefreshDetail: () => void;
  onResetOffsets: (request: ConsumerGroupOffsetResetRequest) => Promise<void>;
}) {
  const language = useAppLanguage();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const normalizedQuery = props.query.trim().toLowerCase();
  const groupedTopics = groupRowsByTopic(props.detail.rows)
    .filter((topic) => topic.topic.toLowerCase().includes(normalizedQuery));
  const lagColumns = useMemo<ColumnDef<ConsumerGroupLagRow>[]>(() => [
    {
      accessorKey: "partition",
      header: "Partition"
    },
    {
      id: "currentOffset",
      header: "Current Offset",
      accessorFn: (row) => /^\d+$/.test(row.currentOffset) ? Number(row.currentOffset) : -1,
      cell: ({ row }) => <span title={row.original.currentOffset}>{row.original.currentOffset}</span>
    },
    {
      id: "endOffset",
      header: "End Offset",
      accessorFn: (row) => /^\d+$/.test(row.endOffset) ? Number(row.endOffset) : -1,
      cell: ({ row }) => <span title={row.original.endOffset}>{row.original.endOffset}</span>
    },
    {
      id: "lag",
      header: "Consumer Lag",
      accessorFn: (row) => /^\d+$/.test(row.lag) ? Number(row.lag) : -1,
      cell: ({ row }) => <span className={row.original.lag !== "-" && row.original.lag !== "0" ? "lag-warn" : ""}>{row.original.lag}</span>
    },
    {
      accessorKey: "metadata",
      header: "Metadata",
      cell: ({ row }) => <span title={row.original.metadata ?? ""}>{row.original.metadata || "-"}</span>
    }
  ], []);

  useEffect(() => {
    setExpandedTopics(new Set());
  }, [props.detail.groupId]);

  function toggleTopic(topic: string) {
    setExpandedTopics((current) => {
      const next = new Set(current);
      if (next.has(topic)) {
        next.delete(topic);
      } else {
        next.add(topic);
      }
      return next;
    });
  }

  return (
    <section className="panel groups-panel">
      <div className="group-detail-header">
        <button className="ghost compact" onClick={props.onBack}>{t(language, "label.consumers")}</button>
        <span>/</span>
        <h2 title={props.detail.groupId}>{props.detail.groupId}</h2>
        <button className="ghost compact" onClick={() => setIsResetDialogOpen(true)}><RotateCcw size={15} /> {t(language, "consumerReset.open")}</button>
        <button className="ghost compact" onClick={props.onRefreshDetail}><RefreshCw size={15} /> {t(language, "label.refresh")}</button>
      </div>
      {isResetDialogOpen && (
        <ConsumerGroupResetOffsetsDialog
          detail={props.detail}
          serverId={props.serverId}
          onClose={() => setIsResetDialogOpen(false)}
          onRefreshDetail={props.onRefreshDetail}
          onResetOffsets={props.onResetOffsets}
        />
      )}
      <div className="group-summary-grid">
        <div><span>{t(language, "label.state")}</span><strong><GroupStateBadge state={props.detail.state} /></strong></div>
        <div><span>{t(language, "label.members")}</span><strong>{props.detail.members}</strong></div>
        <div><span>{t(language, "label.assignedTopics")}</span><strong>{new Set(props.detail.rows.map((row) => row.topic)).size}</strong></div>
        <div><span>{t(language, "label.assignedPartitions")}</span><strong>{props.detail.rows.length}</strong></div>
        <div><span>{t(language, "label.totalLag")}</span><strong className={props.detail.totalLag !== "-" && props.detail.totalLag !== "0" ? "lag-warn" : ""}>{props.detail.totalLag}</strong></div>
      </div>
      <div className="search-box group-search">
        <input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder={t(language, "placeholder.searchTopicName")} />
        {props.query && <button onClick={() => props.onQuery("")} title={t(language, "title.clearSearch")}><X size={13} /></button>}
      </div>
      <div className="group-topic-detail-list">
        {groupedTopics.map((topic) => {
          const isExpanded = expandedTopics.has(topic.topic);
          return (
            <section key={topic.topic} className={isExpanded ? "group-topic-card expanded" : "group-topic-card"}>
              <button
                type="button"
                className="group-topic-row"
                onClick={() => toggleTopic(topic.topic)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <strong title={topic.topic}>{topic.topic}</strong>
                <span className="group-topic-meta">
                  {topic.rows.length} {t(language, "label.partitions")}
                </span>
                <span className={topic.totalLag !== "-" && topic.totalLag !== "0" ? "lag-warn" : ""}>{topic.totalLag}</span>
              </button>
              {isExpanded && (
                <DataGrid
                  data={topic.rows}
                  columns={lagColumns}
                  className="group-lag-table"
                  emptyText={t(language, "label.noCommittedOffsets")}
                  getRowKey={(row) => `${row.topic}-${row.partition}`}
                />
              )}
            </section>
          );
        })}
        {groupedTopics.length === 0 && <div className="empty-list">{t(language, "label.noCommittedOffsets")}</div>}
      </div>
    </section>
  );
}
