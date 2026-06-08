import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { RefreshCw, Trash2, X } from "lucide-react";
import type { ConsumerGroupLagDetail, ConsumerGroupSummary } from "../../../../shared/types";
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
  groups: ConsumerGroupSummary[];
  selectedGroupId: string;
  detail: ConsumerGroupLagDetail | null;
  detailsByGroup: Record<string, ConsumerGroupLagDetail>;
  onSelectGroup: (groupId: string) => void;
  onDeleteGroups: (groupIds: string[]) => void;
  onBack: () => void;
  onRefresh: () => void;
  onRefreshDetail: () => void;
}) {
  const [query, setQuery] = useState("");
  const [groupSorting, setGroupSorting] = useState<SortingState>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGroups = props.groups.filter((group) => group.groupId.toLowerCase().includes(normalizedQuery));
  const filteredGroupIds = useMemo(() => filteredGroups.map((group) => group.groupId), [filteredGroups]);
  const selectedVisibleCount = filteredGroupIds.filter((groupId) => selectedGroupIds.includes(groupId)).length;
  const allVisibleSelected = filteredGroupIds.length > 0 && selectedVisibleCount === filteredGroupIds.length;
  const partlyVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    const liveGroupIds = new Set(props.groups.map((group) => group.groupId));
    setSelectedGroupIds((current) => current.filter((groupId) => liveGroupIds.has(groupId)));
  }, [props.groups]);

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
        <SelectionCheckbox
          checked={allVisibleSelected}
          indeterminate={partlyVisibleSelected}
          title="Select visible consumer groups"
          onChange={toggleVisibleGroupsSelected}
        />
      ),
      cell: ({ row }) => (
        <SelectionCheckbox
          checked={selectedGroupIds.includes(row.original.groupId)}
          title={`Select ${row.original.groupId}`}
          onChange={() => toggleGroupSelected(row.original.groupId)}
        />
      ),
      enableSorting: false,
      enableColumnFilter: false,
      size: 44
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
  ], [allVisibleSelected, partlyVisibleSelected, props.detailsByGroup, selectedGroupIds]);
  if (props.detail) {
    return (
      <ConsumerGroupDetailView
        detail={props.detail}
        query={query}
        onQuery={setQuery}
        onBack={props.onBack}
        onRefreshDetail={props.onRefreshDetail}
      />
    );
  }

  return (
    <section className="panel groups-panel">
      <div className="section-title">
        <h2>Consumers</h2>
        <div className="inline-actions">
          <button
            className="ghost compact danger"
            disabled={selectedGroupIds.length === 0}
            onClick={() => {
              if (!window.confirm(`${selectedGroupIds.length}개 컨슈머 그룹을 삭제할까요? 실행 중인 그룹은 Kafka에서 거부될 수 있습니다.`)) {
                return;
              }
              props.onDeleteGroups(selectedGroupIds);
              setSelectedGroupIds([]);
            }}
            title="Delete selected consumer groups"
          >
            <Trash2 size={15} /> 삭제
          </button>
          <button className="ghost compact" onClick={props.onRefresh}><RefreshCw size={15} /> 조회</button>
        </div>
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
        getRowClassName={(group) => [
          group.groupId === props.selectedGroupId ? "selected" : "",
          selectedGroupIds.includes(group.groupId) ? "row-checked" : ""
        ].filter(Boolean).join(" ")}
        onRowClick={(group) => props.onSelectGroup(group.groupId)}
      />
    </section>
  );
}
