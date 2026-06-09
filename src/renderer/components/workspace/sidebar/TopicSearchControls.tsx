import { ArrowUpDown, RefreshCw, X } from "lucide-react";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import type { TopicListFilter, TopicSortMode } from "../../../uiTypes";
import { topicSortOptions } from "../../../uiTypes";
import { getTopicSortLabel } from "../../../utils";

export function TopicSearchControls(props: {
  totalCount: number;
  filteredCount: number;
  query: string;
  searchHistory: string[];
  searchError: string;
  filter: TopicListFilter;
  sort: TopicSortMode;
  isSortMenuOpen: boolean;
  isConnected: boolean;
  loading: boolean;
  onSortMenuOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  onSort: (sort: TopicSortMode) => void;
  onRefresh: () => void;
  onQuery: (query: string) => void;
  onCommitSearch: () => void;
  onRemoveSearchHistory: (query: string) => void;
  onFilter: (filter: TopicListFilter) => void;
}) {
  const language = useAppLanguage();
  return (
    <>
      <div className="section-title">
        <h2>{t(language, "label.topics")}</h2>
        <div className="topic-title-actions">
          <span>{props.filteredCount}/{props.totalCount}</span>
          <div className="topic-sort-wrap" onClick={(event) => event.stopPropagation()}>
            <button
              className="topic-refresh"
              onClick={() => props.onSortMenuOpen((current) => !current)}
              title={`Sort: ${getTopicSortLabel(props.sort)}`}
            >
              <ArrowUpDown size={14} />
            </button>
            {props.isSortMenuOpen && (
              <div className="topic-sort-menu">
                {topicSortOptions.map((option) => (
                  <button
                    key={option.value}
                    className={props.sort === option.value ? "active" : ""}
                    onClick={() => {
                      props.onSort(option.value);
                      props.onSortMenuOpen(false);
                    }}
                  >
                    <span>{props.sort === option.value ? "*" : ""}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="topic-refresh" onClick={props.onRefresh} disabled={!props.isConnected || props.loading} title={t(language, "title.refreshTopics")}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <div className="search-box topic-search">
        <input
          value={props.query}
          onChange={(event) => props.onQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              props.onCommitSearch();
            }
          }}
          placeholder={t(language, "placeholder.searchTopic")}
          title={t(language, "title.searchTopicSyntax")}
        />
        {props.query && (
          <button onClick={() => props.onQuery("")} title={t(language, "title.clearTopicSearch")}>
            <X size={13} />
          </button>
        )}
      </div>
      {props.searchError && <div className="topic-search-error">{t(language, "topicSearch.invalidRegex", { error: props.searchError })}</div>}
      {!props.searchError && props.query.trim() && (
        <div className="topic-search-help">{t(language, "topicSearch.help")}</div>
      )}
      {props.searchHistory.length > 0 && (
        <div className="topic-search-history">
          {props.searchHistory.map((query) => (
            <button key={query} onClick={() => props.onQuery(query)} title={t(language, "title.searchHistory", { query })}>
              <span>{query}</span>
              <X
                size={12}
                onClick={(event) => {
                  event.stopPropagation();
                  props.onRemoveSearchHistory(query);
                }}
              />
            </button>
          ))}
        </div>
      )}
      <div className="topic-filter-row">
        <select value={props.filter} onChange={(event) => props.onFilter(event.target.value as TopicListFilter)} title={t(language, "title.filterTopics")}>
          <option value="all">{t(language, "label.allTopics")}</option>
          <option value="favorites">{t(language, "label.favorites")}</option>
          <option value="nonEmpty">{t(language, "label.hasMessages")}</option>
        </select>
      </div>
    </>
  );
}
