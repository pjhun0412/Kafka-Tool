import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { RefreshCw, X } from "lucide-react";
import type { ConsumerGroupLagDetail, ConsumerGroupLagRow } from "../../../../shared/types";
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

export function ConsumerGroupDetailView(props: {
  detail: ConsumerGroupLagDetail;
  query: string;
  onQuery: (query: string) => void;
  onBack: () => void;
  onRefreshDetail: () => void;
}) {
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
        <input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="Search by topic name" />
        {props.query && <button onClick={() => props.onQuery("")} title="Clear search"><X size={13} /></button>}
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
