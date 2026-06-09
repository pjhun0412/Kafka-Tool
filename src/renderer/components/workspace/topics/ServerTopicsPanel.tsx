import React, { useMemo } from "react";
import type { ColumnDef, OnChangeFn, SortingState } from "@tanstack/react-table";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
import type { TopicSummary } from "../../../../shared/types";
import { DataGrid } from "../../DataGrid";
import { formatCount } from "../../../utils";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

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
  onCreateTopic: () => void;
  onPurgeSelected: () => void;
  onDeleteSelected: () => void;
  onToggleFavorite: (topic: string) => void;
}) {
  const language = useAppLanguage();
  const favorites = new Set(props.favoriteTopicNames);
  const selected = new Set(props.selectedTopics);
  const visibleTopicNames = props.topics.map((topic) => topic.name);
  const selectedVisibleCount = visibleTopicNames.filter((topic) => selected.has(topic)).length;
  const allVisibleSelected = visibleTopicNames.length > 0 && selectedVisibleCount === visibleTopicNames.length;
  const columns = useMemo<ColumnDef<TopicSummary>[]>(() => [
    {
      id: "check",
      header: "",
      enableSorting: false,
      cell: ({ row }) => (
        <span
          role="button"
          tabIndex={0}
          className="grid-check-cell"
          onClick={(event) => {
            event.stopPropagation();
            props.onToggleSelected(row.original.name);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              props.onToggleSelected(row.original.name);
            }
          }}
          onDoubleClick={(event) => event.stopPropagation()}
          title={`Select ${row.original.name}`}
        >
          <input
            type="checkbox"
            checked={selected.has(row.original.name)}
            readOnly
            title={`Select ${row.original.name}`}
          />
        </span>
      ),
      enableColumnFilter: false,
      size: 32
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
      size: 36,
      accessorFn: (topic) => favorites.has(topic.name) ? 1 : 0,
      cell: ({ row }) => {
        const isFavorite = favorites.has(row.original.name);
        return (
          <span
            className="grid-favorite-cell"
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              props.onToggleFavorite(row.original.name);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                props.onToggleFavorite(row.original.name);
              }
            }}
            onDoubleClick={(event) => event.stopPropagation()}
            title={isFavorite ? t(language, "title.removeFavorite") : t(language, "title.addFavorite")}
            aria-label={isFavorite ? t(language, "title.removeFavorite") : t(language, "title.addFavorite")}
          >
            <button
              type="button"
              className={isFavorite ? "topic-favorite server-topic-favorite favorite" : "topic-favorite server-topic-favorite"}
              tabIndex={-1}
            >
              <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </span>
        );
      }
    }
  ], [favorites, language, props.onToggleFavorite, props.onToggleSelected, selected]);
  return (
    <section className="panel server-topics-panel">
      <div className="section-title">
        <h2>{t(language, "label.topics")}</h2>
        <div className="section-title-actions">
          <span>{props.topics.length} {t(language, "label.topics")}</span>
          <button className="primary compact" type="button" onClick={props.onCreateTopic} title={t(language, "title.createTopic")}>
            <Plus size={14} />
            {t(language, "topicCreate.create")}
          </button>
        </div>
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
          {t(language, "label.selected", { count: String(props.selectedTopics.length) })}
        </label>
        <button className="ghost compact" onClick={props.onCopySelected} disabled={props.selectedTopics.length === 0}><Copy size={14} /> {t(language, "label.copy")}</button>
        <button className="ghost compact" onClick={props.onPurgeSelected} disabled={props.selectedTopics.length === 0}><Trash2 size={14} /> {t(language, "label.purge")}</button>
        <button className="danger compact" onClick={props.onDeleteSelected} disabled={props.selectedTopics.length === 0}><Trash2 size={14} /> {t(language, "action.delete")}</button>
      </div>
      <DataGrid
        data={props.topics}
        columns={columns}
        className="server-topics-table"
        emptyText={t(language, "label.noTopicsFound")}
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
