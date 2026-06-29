import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { RefreshCw, Trash2, X } from "lucide-react";
import type { ConsumerGroupLagDetail, ConsumerGroupOffsetResetRequest, ConsumerGroupSummary } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { DataGrid } from "../../DataGrid";
import { ConsumerGroupDetailView } from "./ConsumerGroupDetailView";
import { GroupStateBadge } from "./GroupStateBadge";

function SelectionCheckbox(props: {
  checked: boolean;
  indeterminate?: boolean;
  title: string;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = Boolean(props.indeterminate);
    }
  }, [props.indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={props.checked}
      title={props.title}
      onChange={props.onChange}
      onClick={(event) => event.stopPropagation()}
    />
  );
}

export function ConsumerGroupsPanel(props: {
  serverId: string;
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  detail: ConsumerGroupLagDetail | null;
  detailsByGroup: Record<string, ConsumerGroupLagDetail>;
  onSelectGroup: (groupId: string) => void;
  onDeleteGroups: (groupIds: string[]) => void;
  onResetOffsets: (request: ConsumerGroupOffsetResetRequest) => Promise<void>;
  onBack: () => void;
  onRefresh: () => void;
  onRefreshDetail: () => void;
}) {
  const language = useAppLanguage();
  const [groupQuery, setGroupQuery] = useState("");
  const [detailQuery, setDetailQuery] = useState("");
  const [groupSorting, setGroupSorting] = useState<SortingState>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const normalizedQuery = groupQuery.trim().toLowerCase();
  const filteredGroups = props.groups.filter((group) => group.groupId.toLowerCase().includes(normalizedQuery));
  const filteredGroupIds = useMemo(() => filteredGroups.map((group) => group.groupId), [filteredGroups]);
  const selectedVisibleCount = filteredGroupIds.filter((groupId) => selectedGroupIds.includes(groupId)).length;
  const allVisibleSelected = filteredGroupIds.length > 0 && selectedVisibleCount === filteredGroupIds.length;
  const partlyVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    const liveGroupIds = new Set(props.groups.map((group) => group.groupId));
    setSelectedGroupIds((current) => current.filter((groupId) => liveGroupIds.has(groupId)));
  }, [props.groups]);

  useEffect(() => {
    setDetailQuery("");
  }, [props.selectedGroupId]);

  function toggleGroupSelected(groupId: string) {
    setSelectedGroupIds((current) => (
      current.includes(groupId)
        ? current.filter((item) => item !== groupId)
        : [...current, groupId]
    ));
  }

  function toggleVisibleGroupsSelected() {
    setSelectedGroupIds((current) => {
      if (allVisibleSelected) {
        const visibleIds = new Set(filteredGroupIds);
        return current.filter((groupId) => !visibleIds.has(groupId));
      }
      return [...new Set([...current, ...filteredGroupIds])];
    });
  }
  const groupColumns = useMemo<ColumnDef<ConsumerGroupSummary>[]>(() => [
    {
      id: "select",
      header: () => (
        <span
          className="grid-check-cell"
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            toggleVisibleGroupsSelected();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleVisibleGroupsSelected();
            }
          }}
        >
          <SelectionCheckbox
            checked={allVisibleSelected}
            indeterminate={partlyVisibleSelected}
            title={t(language, "title.selectVisibleConsumerGroups")}
            onChange={toggleVisibleGroupsSelected}
          />
        </span>
      ),
      cell: ({ row }) => (
        <span
          role="button"
          tabIndex={0}
          className="grid-check-cell"
          onClick={(event) => {
            event.stopPropagation();
            toggleGroupSelected(row.original.groupId);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleGroupSelected(row.original.groupId);
            }
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          title={`Select ${row.original.groupId}`}
        >
          <SelectionCheckbox
            checked={selectedGroupIds.includes(row.original.groupId)}
            title={`Select ${row.original.groupId}`}
            onChange={() => toggleGroupSelected(row.original.groupId)}
          />
        </span>
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 32
    },
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
  ], [allVisibleSelected, language, partlyVisibleSelected, props.detailsByGroup, selectedGroupIds]);
  if (props.detail) {
    return (
      <ConsumerGroupDetailView
        detail={props.detail}
        serverId={props.serverId}
        query={detailQuery}
        onQuery={setDetailQuery}
        onBack={props.onBack}
        onRefreshDetail={props.onRefreshDetail}
        onResetOffsets={props.onResetOffsets}
      />
    );
  }

  return (
    <section className="panel groups-panel">
      <div className="section-title">
        <h2>{t(language, "label.consumers")}</h2>
        <div className="inline-actions">
          <button
            className="ghost compact danger"
            disabled={selectedGroupIds.length === 0}
            onClick={() => {
              if (!window.confirm(t(language, "confirm.deleteConsumerGroups", { count: String(selectedGroupIds.length) }))) {
                return;
              }
              props.onDeleteGroups(selectedGroupIds);
              setSelectedGroupIds([]);
            }}
            title={t(language, "title.deleteSelectedConsumerGroups")}
          >
            <Trash2 size={15} /> {t(language, "action.delete")}
          </button>
          <button className="ghost compact" onClick={props.onRefresh}><RefreshCw size={15} /> {t(language, "label.query")}</button>
        </div>
      </div>
      <div className="search-box group-search">
        <input value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder={t(language, "placeholder.searchConsumerGroup")} />
        {groupQuery && <button onClick={() => setGroupQuery("")} title={t(language, "title.clearSearch")}><X size={13} /></button>}
      </div>
      <DataGrid
        data={filteredGroups}
        columns={groupColumns}
        className="consumer-groups-table"
        emptyText={t(language, "label.noConsumerGroups")}
        sorting={groupSorting}
        onSortingChange={setGroupSorting}
        getRowKey={(group) => group.groupId}
        getRowClassName={(group) => [
          group.groupId === props.selectedGroupId ? "selected" : "",
          selectedGroupIds.includes(group.groupId) ? "row-checked" : ""
        ].filter(Boolean).join(" ")}
        onRowClick={(group) => {
          setDetailQuery("");
          props.onSelectGroup(group.groupId);
        }}
      />
    </section>
  );
}
