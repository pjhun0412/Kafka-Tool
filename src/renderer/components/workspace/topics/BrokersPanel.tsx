import React, { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { BrokerSummary } from "../../../../shared/types";
import { DataGrid } from "../../DataGrid";
import { formatCompactNumber, formatPercent } from "../../../utils";

export function BrokersPanel({ brokers }: { brokers: BrokerSummary[] }) {
  const totalOnlinePartitions = brokers.reduce((total, broker) => total + broker.onlinePartitionCount, 0);
  const totalReplicas = brokers.reduce((total, broker) => total + broker.replicaCount, 0);
  const totalInSyncReplicas = brokers.reduce((total, broker) => total + broker.inSyncReplicaCount, 0);
  const totalOutOfSyncReplicas = brokers.reduce((total, broker) => total + broker.outOfSyncReplicaCount, 0);
  const totalUnderReplicatedPartitions = brokers.reduce((total, broker) => total + broker.underReplicatedPartitionCount, 0);
  const controller = brokers.find((broker) => broker.controller);
  const columns = useMemo<ColumnDef<BrokerSummary>[]>(() => [
    {
      accessorKey: "nodeId",
      header: "Broker ID",
      cell: ({ row }) => (
        <span className="broker-id-cell">
          {row.original.nodeId}
          {row.original.controller && <span className="controller-badge">Controller</span>}
        </span>
      )
    },
    {
      accessorKey: "partitionSkewPercent",
      header: "Partitions Skew",
      cell: ({ row }) => (
        <span className={Math.abs(row.original.partitionSkewPercent) > 10 ? "metric-warn" : ""}>
          {formatPercent(row.original.partitionSkewPercent)}
        </span>
      )
    },
    {
      accessorKey: "leaderCount",
      header: "Leaders",
      cell: ({ row }) => formatCompactNumber(row.original.leaderCount)
    },
    {
      accessorKey: "leaderSkewPercent",
      header: "Leader Skew",
      cell: ({ row }) => (
        <span className={Math.abs(row.original.leaderSkewPercent) > 10 ? "metric-warn" : ""}>
          {formatPercent(row.original.leaderSkewPercent)}
        </span>
      )
    },
    {
      accessorKey: "onlinePartitionCount",
      header: "Online Partitions",
      cell: ({ row }) => formatCompactNumber(row.original.onlinePartitionCount)
    },
    {
      accessorKey: "replicaCount",
      header: "Replicas",
      cell: ({ row }) => formatCompactNumber(row.original.replicaCount)
    },
    {
      accessorKey: "outOfSyncReplicaCount",
      header: "OOS Replicas",
      cell: ({ row }) => (
        <span className={row.original.outOfSyncReplicaCount > 0 ? "metric-warn" : ""}>
          {formatCompactNumber(row.original.outOfSyncReplicaCount)}
        </span>
      )
    },
    {
      accessorKey: "port",
      header: "Port"
    },
    {
      accessorKey: "host",
      header: "Host",
      cell: ({ row }) => <span title={row.original.host}>{row.original.host}</span>
    }
  ], []);

  return (
    <section className="panel brokers-panel">
      <div className="section-title">
        <h2>Brokers</h2>
        <span>{brokers.length} brokers</span>
      </div>
      <div className="broker-summary-grid">
        <div className="broker-summary-card">
          <span>Broker Count</span>
          <strong>{brokers.length}</strong>
        </div>
        <div className="broker-summary-card">
          <span>Active Controller</span>
          <strong>{controller?.nodeId ?? "-"}</strong>
        </div>
        <div className="broker-summary-card">
          <span>Online Partitions</span>
          <strong>{formatCompactNumber(totalOnlinePartitions)}</strong>
        </div>
        <div className="broker-summary-card">
          <span>URP</span>
          <strong className={totalUnderReplicatedPartitions > 0 ? "metric-warn" : ""}>{formatCompactNumber(totalUnderReplicatedPartitions)}</strong>
        </div>
        <div className="broker-summary-card">
          <span>In Sync Replicas</span>
          <strong>{formatCompactNumber(totalInSyncReplicas)} <small>of {formatCompactNumber(totalReplicas)}</small></strong>
        </div>
        <div className="broker-summary-card">
          <span>Out Of Sync Replicas</span>
          <strong className={totalOutOfSyncReplicas > 0 ? "metric-warn" : ""}>{formatCompactNumber(totalOutOfSyncReplicas)}</strong>
        </div>
      </div>
      <DataGrid
        data={brokers}
        columns={columns}
        className="broker-table"
        emptyText="No brokers loaded"
        getRowKey={(broker) => String(broker.nodeId)}
      />
    </section>
  );
}
