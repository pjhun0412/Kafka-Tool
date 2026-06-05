import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Braces, Calendar, CheckCircle2, ChevronDown, ChevronRight, ChevronUp, Copy, Download, EyeOff, Filter, HelpCircle, Layers, Play, RefreshCw, Send, Sparkles, Square, Star, Trash2, X, XCircle } from "lucide-react";
import type { BrokerSummary, ConsumedMessage, ConsumerGroupLagDetail, ConsumerGroupLagRow, ConsumerGroupSummary, ManualAvroSchema, MessageExportFormat, ServerProfile, TopicDetail, TopicSummary } from "../../../../shared/types";
import { Button, IconButton } from "../../ui";
import { DataGrid } from "../../DataGrid";
import type { ConsumeFilterField, ConsumeFilterMode, ConsumeMode, JsonInspectorMode, OffsetOrder, SplitPaneState, TopicConsumeState, View } from "../../../uiTypes";
import { filterMessages } from "../../../messageFilters";
import { formatCompactNumber, formatCount, formatHeaders, formatMessagePayload, formatPercent, formatTimestamp, getEpochTitle, getPartitionColor, parseJson, previewHeaders, previewValue, renderHighlightedText, renderRawJsonText, stringifyPrimitive } from "../../../utils";
export function GroupStateBadge({ state }: { state?: string }) {
  const normalized = (state || "unknown").toLowerCase();
  return <span className={`group-state-badge ${normalized}`}>{state || "UNKNOWN"}</span>;
}

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

export function ConsumerGroupsPanel(props: {
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  detail: ConsumerGroupLagDetail | null;
  detailsByGroup: Record<string, ConsumerGroupLagDetail>;
  onSelectGroup: (groupId: string) => void;
  onBack: () => void;
  onRefresh: () => void;
  onRefreshDetail: () => void;
}) {
  const [query, setQuery] = useState("");
  const [groupSorting, setGroupSorting] = useState<SortingState>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = props.groups.filter((group) => group.groupId.toLowerCase().includes(normalizedQuery));
  const groupColumns = useMemo<ColumnDef<ConsumerGroupSummary>[]>(() => [
    {
      accessorKey: "groupId",
      header: "Group ID",
      cell: ({ row }) => <strong title={row.original.groupId}>{row.original.groupId}</strong>
    },
    {
      id: "members",
      header: "Num Of Members",
      accessorFn: (group) => group.members ?? -1,
      cell: ({ row }) => row.original.members ?? "-"
    },
    {
      id: "topics",
      header: "Num Of Topics",
      accessorFn: (group) => props.detailsByGroup[group.groupId]
        ? new Set(props.detailsByGroup[group.groupId].rows.map((item) => item.topic)).size
        : group.topics ?? -1,
      cell: ({ row }) => {
        const detail = props.detailsByGroup[row.original.groupId];
        return detail ? new Set(detail.rows.map((item) => item.topic)).size : row.original.topics ?? "-";
      }
    },
    {
      id: "lag",
      header: "Consumer Lag",
      accessorFn: (group) => {
        const lag = props.detailsByGroup[group.groupId]?.totalLag ?? group.totalLag;
        return /^\d+$/.test(lag ?? "") ? Number(lag) : -1;
      },
      cell: ({ row }) => {
        const lag = props.detailsByGroup[row.original.groupId]?.totalLag ?? row.original.totalLag ?? "N/A";
        return <span className={lag !== "N/A" && lag !== "-" && lag !== "0" ? "lag-warn" : ""}>{lag}</span>;
      }
    },
    {
      accessorKey: "coordinator",
      header: "Coordinator",
      cell: ({ row }) => row.original.coordinator ?? "-"
    },
    {
      accessorKey: "state",
      header: "State",
      cell: ({ row }) => <GroupStateBadge state={row.original.state} />
    }
  ], [props.detailsByGroup]);
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

  if (props.detail) {
    const groupedTopics = groupRowsByTopic(props.detail.rows).filter((topic) => topic.topic.toLowerCase().includes(normalizedQuery));
    return (
      <section className="panel groups-panel">
        <div className="group-detail-header">
          <button className="ghost compact" onClick={props.onBack}>Consumers</button>
          <span>/</span>
          <h2 title={props.detail.groupId}>{props.detail.groupId}</h2>
          <button className="ghost compact" onClick={props.onRefreshDetail}><RefreshCw size={15} /> 새로고침</button>
        </div>
        <div className="group-summary-grid">
          <div><span>State</span><strong><GroupStateBadge state={props.detail.state} /></strong></div>
          <div><span>Members</span><strong>{props.detail.members}</strong></div>
          <div><span>Assigned Topics</span><strong>{new Set(props.detail.rows.map((row) => row.topic)).size}</strong></div>
          <div><span>Assigned Partitions</span><strong>{props.detail.rows.length}</strong></div>
          <div><span>Total Lag</span><strong className={props.detail.totalLag !== "-" && props.detail.totalLag !== "0" ? "lag-warn" : ""}>{props.detail.totalLag}</strong></div>
        </div>
        <div className="search-box group-search">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic name" />
          {query && <button onClick={() => setQuery("")} title="Clear search"><X size={13} /></button>}
        </div>
        <div className="group-topic-detail-list">
          {groupedTopics.map((topic) => (
            <section key={topic.topic} className="group-topic-card">
              <div className="group-topic-row">
                <strong title={topic.topic}>{topic.topic}</strong>
                <span className={topic.totalLag !== "-" && topic.totalLag !== "0" ? "lag-warn" : ""}>{topic.totalLag}</span>
              </div>
              <DataGrid
                data={topic.rows}
                columns={lagColumns}
                className="group-lag-table"
                emptyText="No committed offsets"
                getRowKey={(row) => `${row.topic}-${row.partition}`}
              />
            </section>
          ))}
          {groupedTopics.length === 0 && <div className="empty-list">No committed offsets</div>}
        </div>
      </section>
    );
  }

  return (
    <section className="panel groups-panel">
      <div className="section-title">
        <h2>Consumers</h2>
        <button className="ghost compact" onClick={props.onRefresh}><RefreshCw size={15} /> 조회</button>
      </div>
      <div className="search-box group-search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by Consumer Group ID" />
        {query && <button onClick={() => setQuery("")} title="Clear search"><X size={13} /></button>}
      </div>
      <DataGrid
        data={filteredGroups}
        columns={groupColumns}
        className="consumer-groups-table"
        emptyText="No consumer groups"
        sorting={groupSorting}
        onSortingChange={setGroupSorting}
        getRowKey={(group) => group.groupId}
        getRowClassName={(group) => (group.groupId === props.selectedGroupId ? "selected" : "")}
        onRowClick={(group) => props.onSelectGroup(group.groupId)}
      />
    </section>
  );
}

export function GroupsPanel(props: {
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  detail: ConsumerGroupLagDetail | null;
  onSelectGroup: (groupId: string) => void;
  onRefresh: () => void;
  onRefreshDetail: () => void;
}) {
  return (
    <section className="panel groups-panel">
      <div className="section-title">
        <h2>Consumers</h2>
        <button className="ghost compact" onClick={props.onRefresh}><RefreshCw size={15} /> 조회</button>
      </div>
      <div className="groups-layout">
        <div className="group-list">
          {props.groups.map((group) => (
            <button
              key={group.groupId}
              className={group.groupId === props.selectedGroupId ? "group-row active" : "group-row"}
              onClick={() => props.onSelectGroup(group.groupId)}
              title={group.groupId}
            >
              <strong>{group.groupId}</strong>
              <span>{group.protocol || "-"}</span>
            </button>
          ))}
          {props.groups.length === 0 && <div className="empty-list">No consumer groups</div>}
        </div>
        <div className="group-detail">
          {props.detail ? (
            <>
              <div className="group-summary">
                <div>
                  <span>Total lag</span>
                  <strong>{props.detail.totalLag}</strong>
                </div>
                <div>
                  <span>State</span>
                  <strong>{props.detail.state || "-"}</strong>
                </div>
                <div>
                  <span>Members</span>
                  <strong>{props.detail.members}</strong>
                </div>
                <div>
                  <span>Rows</span>
                  <strong>{props.detail.rows.length}</strong>
                </div>
                <button className="ghost compact" onClick={props.onRefreshDetail}><RefreshCw size={15} /> Lag</button>
              </div>
              <div className="message-table group-lag-table">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Partition</th>
                      <th>Current</th>
                      <th>End</th>
                      <th>Lag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.detail.rows.map((row) => (
                      <tr key={`${row.topic}-${row.partition}`}>
                        <td title={row.topic}>{row.topic}</td>
                        <td>{row.partition}</td>
                        <td title={row.currentOffset}>{row.currentOffset}</td>
                        <td title={row.endOffset}>{row.endOffset}</td>
                        <td className={row.lag !== "-" && row.lag !== "0" ? "lag-warn" : ""}>{row.lag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {props.detail.rows.length === 0 && <div className="empty-list">No committed offsets</div>}
              </div>
            </>
          ) : (
            <div className="empty-list group-detail-empty">그룹을 선택하면 lag 상세가 표시됩니다.</div>
          )}
        </div>
      </div>
    </section>
  );
}
