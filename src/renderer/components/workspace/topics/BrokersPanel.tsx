import React, { useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, Pencil, Save, X } from "lucide-react";
import type { BrokerConfigEntry, BrokerDetail, BrokerSummary } from "../../../../shared/types";
import { DataGrid } from "../../DataGrid";
import { formatCompactNumber, formatPercent } from "../../../utils";

type BrokerDetailTab = "logs" | "configs" | "metrics";

function buildConfigDrafts(configs: BrokerConfigEntry[]) {
  return Object.fromEntries(configs.map((config) => [config.name, config.value]));
}

function getConfigDisplayValue(config: BrokerConfigEntry) {
  if (config.isSensitive) return "********";
  if (config.value === "") return "null";
  return config.value;
}

export function BrokersPanel({ serverId, brokers }: { serverId: string; brokers: BrokerSummary[] }) {
  const [selectedBrokerId, setSelectedBrokerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<BrokerDetailTab>("logs");
  const [detail, setDetail] = useState<BrokerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [configQuery, setConfigQuery] = useState("");
  const [configDrafts, setConfigDrafts] = useState<Record<string, string>>({});
  const [editingConfigName, setEditingConfigName] = useState("");
  const [savingConfigName, setSavingConfigName] = useState("");
  const totalOnlinePartitions = brokers.reduce((total, broker) => total + broker.onlinePartitionCount, 0);
  const totalReplicas = brokers.reduce((total, broker) => total + broker.replicaCount, 0);
  const totalInSyncReplicas = brokers.reduce((total, broker) => total + broker.inSyncReplicaCount, 0);
  const totalOutOfSyncReplicas = brokers.reduce((total, broker) => total + broker.outOfSyncReplicaCount, 0);
  const totalUnderReplicatedPartitions = brokers.reduce((total, broker) => total + broker.underReplicatedPartitionCount, 0);
  const controller = brokers.find((broker) => broker.controller);
  const selectedBroker = brokers.find((broker) => broker.nodeId === selectedBrokerId) ?? detail?.broker ?? null;
  const visibleConfigs = useMemo(() => {
    const query = configQuery.trim().toLowerCase();
    const configs = detail?.configs ?? [];
    if (!query) return configs;
    return configs.filter((config) => (
      config.name.toLowerCase().includes(query) ||
      config.value.toLowerCase().includes(query) ||
      config.source.toLowerCase().includes(query)
    ));
  }, [configQuery, detail?.configs]);
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

  useEffect(() => {
    if (selectedBrokerId !== null && !brokers.some((broker) => broker.nodeId === selectedBrokerId)) {
      setSelectedBrokerId(null);
      setDetail(null);
    }
  }, [brokers, selectedBrokerId]);

  useEffect(() => {
    if (!serverId || selectedBrokerId === null) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError("");
    window.kafkaApi.getBrokerDetail(serverId, selectedBrokerId)
      .then((nextDetail) => {
        if (cancelled) return;
        setDetail(nextDetail);
        setConfigDrafts(buildConfigDrafts(nextDetail.configs));
        setEditingConfigName("");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setDetailError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBrokerId, serverId]);

  async function saveConfig(config: BrokerConfigEntry) {
    if (!serverId || selectedBrokerId === null) return;
    setSavingConfigName(config.name);
    setDetailError("");
    try {
      const nextDetail = await window.kafkaApi.updateBrokerConfig({
        serverId,
        brokerId: selectedBrokerId,
        name: config.name,
        value: configDrafts[config.name] ?? ""
      });
      setDetail(nextDetail);
      setConfigDrafts(buildConfigDrafts(nextDetail.configs));
      setEditingConfigName("");
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : String(error));
    } finally {
      setSavingConfigName("");
    }
  }

  function closeBrokerDetail() {
    setSelectedBrokerId(null);
    setDetail(null);
    setDetailError("");
    setConfigQuery("");
    setEditingConfigName("");
    setActiveTab("logs");
  }

  if (selectedBrokerId !== null) {
    return (
      <section className="panel brokers-panel broker-detail-page">
        <div className="broker-page-title">
          <button type="button" title="Back to brokers" onClick={closeBrokerDetail}>
            <ChevronLeft size={16} />
            Brokers
          </button>
          <span>/</span>
          <h2>Broker {selectedBrokerId}</h2>
        </div>
        <div className="broker-page-summary-grid">
          <div>
            <span>Leaders</span>
            <strong>{selectedBroker ? formatCompactNumber(selectedBroker.leaderCount) : "-"}</strong>
          </div>
          <div>
            <span>Replicas</span>
            <strong>{selectedBroker ? formatCompactNumber(selectedBroker.replicaCount) : "-"}</strong>
          </div>
          <div>
            <span>Port</span>
            <strong>{selectedBroker?.port ?? "-"}</strong>
          </div>
          <div className="wide">
            <span>Host</span>
            <strong title={selectedBroker?.host}>{selectedBroker?.host ?? "-"}</strong>
          </div>
        </div>
        <div className="broker-detail-tabs broker-page-tabs">
          <button className={activeTab === "logs" ? "active" : ""} type="button" onClick={() => setActiveTab("logs")}>Log directories</button>
          <button className={activeTab === "configs" ? "active" : ""} type="button" onClick={() => setActiveTab("configs")}>Configs</button>
          <button className={activeTab === "metrics" ? "active" : ""} type="button" onClick={() => setActiveTab("metrics")}>Metrics</button>
        </div>
        {detailError && <div className="broker-detail-error">{detailError}</div>}
        {detailLoading && <div className="broker-detail-empty">Loading broker details...</div>}
        {!detailLoading && activeTab === "logs" && (
          <div className="broker-log-table">
            <div className="broker-log-header">
              <span>Name</span>
              <span>Error</span>
              <span>Topics</span>
              <span>Partitions</span>
            </div>
            {detail?.logDirectories.length ? detail.logDirectories.map((directory) => (
              <div className="broker-log-row" key={directory.path}>
                <strong>{directory.path}</strong>
                <span>{directory.error ?? "-"}</span>
                <span>{new Set(directory.topics.map((topic) => topic.topic)).size}</span>
                <span>{directory.topics.length}</span>
              </div>
            )) : (
              <div className="broker-detail-empty">
                KafkaJS does not expose DescribeLogDirs in the current client. Log directories can be added with a custom Kafka protocol request or external metrics integration.
              </div>
            )}
          </div>
        )}
        {!detailLoading && activeTab === "configs" && (
          <div className="broker-configs-panel broker-page-configs">
            <div className="broker-config-toolbar">
              <input value={configQuery} onChange={(event) => setConfigQuery(event.target.value)} placeholder="Search by key or value" />
              <span>{visibleConfigs.length} configs</span>
            </div>
            <div className="broker-config-list">
              <div className="broker-config-row broker-config-heading">
                <span>Key</span>
                <span>Value</span>
                <span>Source</span>
                <span></span>
              </div>
              {visibleConfigs.map((config) => {
                const editing = editingConfigName === config.name;
                const draftValue = configDrafts[config.name] ?? "";
                const changed = draftValue !== config.value;
                return (
                  <div className="broker-config-row" key={config.name}>
                    <div className="broker-config-name">
                      <strong>{config.name}</strong>
                      {(config.readOnly || config.isSensitive) && (
                        <span>{config.readOnly ? "read only" : ""}{config.readOnly && config.isSensitive ? " / " : ""}{config.isSensitive ? "sensitive" : ""}</span>
                      )}
                    </div>
                    {editing ? (
                      <input
                        autoFocus
                        value={draftValue}
                        placeholder={config.isSensitive ? "Enter new sensitive value" : undefined}
                        onChange={(event) => setConfigDrafts((current) => ({ ...current, [config.name]: event.target.value }))}
                      />
                    ) : (
                      <span className="broker-config-value" title={getConfigDisplayValue(config)}>{getConfigDisplayValue(config)}</span>
                    )}
                    <span className="broker-config-source">{config.source}</span>
                    <div className="broker-config-actions">
                      {editing ? (
                        <>
                          <button disabled={!changed || savingConfigName === config.name} type="button" title="Save config" onClick={() => void saveConfig(config)}>
                            <Save size={14} />
                            {savingConfigName === config.name ? "Saving" : "Save"}
                          </button>
                          <button type="button" title="Cancel edit" onClick={() => {
                            setConfigDrafts((current) => ({ ...current, [config.name]: config.value }));
                            setEditingConfigName("");
                          }}>
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button type="button" title="Edit config" onClick={() => setEditingConfigName(config.name)}>
                          <Pencil size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {visibleConfigs.length === 0 && <div className="broker-detail-empty">No configs matched</div>}
            </div>
          </div>
        )}
        {!detailLoading && activeTab === "metrics" && selectedBroker && (
          <div className="broker-metrics-grid broker-page-metrics">
            <div><span>Leaders</span><strong>{formatCompactNumber(selectedBroker.leaderCount)}</strong></div>
            <div><span>Leader Skew</span><strong className={Math.abs(selectedBroker.leaderSkewPercent) > 10 ? "metric-warn" : ""}>{formatPercent(selectedBroker.leaderSkewPercent)}</strong></div>
            <div><span>Replicas</span><strong>{formatCompactNumber(selectedBroker.replicaCount)}</strong></div>
            <div><span>Partition Skew</span><strong className={Math.abs(selectedBroker.partitionSkewPercent) > 10 ? "metric-warn" : ""}>{formatPercent(selectedBroker.partitionSkewPercent)}</strong></div>
            <div><span>In Sync Replicas</span><strong>{formatCompactNumber(selectedBroker.inSyncReplicaCount)}</strong></div>
            <div><span>Out Of Sync Replicas</span><strong className={selectedBroker.outOfSyncReplicaCount > 0 ? "metric-warn" : ""}>{formatCompactNumber(selectedBroker.outOfSyncReplicaCount)}</strong></div>
            <div><span>Online Partitions</span><strong>{formatCompactNumber(selectedBroker.onlinePartitionCount)}</strong></div>
            <div><span>URP</span><strong className={selectedBroker.underReplicatedPartitionCount > 0 ? "metric-warn" : ""}>{formatCompactNumber(selectedBroker.underReplicatedPartitionCount)}</strong></div>
          </div>
        )}
      </section>
    );
  }

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
        onRowClick={(broker) => {
          setSelectedBrokerId(broker.nodeId);
          setActiveTab("logs");
        }}
      />
    </section>
  );
}
