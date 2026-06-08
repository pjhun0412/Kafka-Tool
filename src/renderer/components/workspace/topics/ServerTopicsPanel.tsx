import React, { useMemo } from "react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { Copy, Star, Trash2 } from "lucide-react";
import type { TopicSummary } from "../../../../shared/types";
import { DataGrid } from "../../DataGrid";
import { formatCount } from "../../../utils";

export function ServerTopicsPanel(props: {
  topics: TopicSummary[];
  favoriteTopicNames: string[];
  selectedTopics: string[];
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  onOpen: (topic: string) => void;
  onSelect: (topic: string) => void;
  onToggleSelected: (topic: string) => void;
  onToggleAllSelected: (topics: string[]) => void;
  onCopySelected: () => void;
  onPurgeSelected: () => void;
  onDeleteSelected: () => void;
  onToggleFavorite: (topic: string) => void;
}) {
  const favorites = new Set(props.favoriteTopicNames);
  const selected = new Set(props.selectedTopics);
  const visibleTopicNames = props.topics.map((topic) => topic.name);
  const selectedVisibleCount = visibleTopicNames.filter((topic) => selected.has(topic)).length;
  const allVisibleSelected = visibleTopicNames.length > 0 && selectedVisibleCount === visibleTopicNames.length;
  const columns = useMemo<ColumnDef<TopicSummary>[]>(() => [
    {
      id: "check",
      header: "CHK",
      enableSorting: false,
      cell: ({ row }) => (
        <span className="check-column" onClick={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected.has(row.original.name)}
            onChange={() => props.onToggleSelected(row.original.name)}
            title={`Select ${row.original.name}`}
          />
        </span>
      )
    },
    {
      accessorKey: "name",
      header: "Topic",
      cell: ({ row }) => <span title={row.original.name}>{row.original.name}</span>
    },
    {
      accessorKey: "partitions",
      header: "Partitions"
    },
    {
      accessorKey: "replicationFactor",
      header: "RF"
    },
    {
      id: "messages",
      header: "Messages",
      accessorFn: (topic) => Number(topic.messageCount ?? 0),
      cell: ({ row }) => <span title={row.original.messageCount ?? "0"}>{formatCount(row.original.messageCount)}</span>
    },
    {
      id: "favorite",
      header: "Fav",
      accessorFn: (topic) => favorites.has(topic.name) ? 1 : 0,
      cell: ({ row }) => {
        const isFavorite = favorites.has(row.original.name);
        return (
          <button
            type="button"
            className={isFavorite ? "topic-favorite server-topic-favorite favorite" : "topic-favorite server-topic-favorite"}
            onClick={(event) => {
              event.stopPropagation();
              props.onToggleFavorite(row.original.name);
            }}
            onDoubleClick={(event) => event.stopPropagation()}
            title={isFavorite ? "Remove favorite" : "Add favorite"}
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          >
            <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        );
      }
    }
  ], [favorites, props.onToggleFavorite, props.onToggleSelected, selected]);
  return (
    <section className="panel server-topics-panel">
      <div className="section-title">
        <h2>Topics</h2>
        <span>{props.topics.length} topics</span>
      </div>
      <div className="topic-actionbar">
        <label className="topic-select-all">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={(input) => {
              if (input) input.indeterminate = selectedVisibleCount > 0 && !allVisibleSelected;
            }}
            onChange={() => props.onToggleAllSelected(visibleTopicNames)}
            disabled={visibleTopicNames.length === 0}
          />
          {props.selectedTopics.length} selected
        </label>
        <button className="ghost compact" onClick={props.onCopySelected} disabled={props.selectedTopics.length === 0}><Copy size={14} /> Copy</button>
        <button className="ghost compact" onClick={props.onPurgeSelected} disabled={props.selectedTopics.length === 0}><Trash2 size={14} /> Purge</button>
        <button className="danger compact" onClick={props.onDeleteSelected} disabled={props.selectedTopics.length === 0}><Trash2 size={14} /> Delete</button>
      </div>
      <DataGrid
        data={props.topics}
        columns={columns}
        className="server-topics-table"
        emptyText="No topics found"
        sorting={props.sorting}
        onSortingChange={props.onSortingChange}
        getRowKey={(topic) => topic.name}
        getRowClassName={(topic) => (selected.has(topic.name) ? "selected" : "")}
        onRowClick={(topic) => props.onSelect(topic.name)}
        onRowDoubleClick={(topic) => props.onOpen(topic.name)}
      />
    </section>
  );
}
