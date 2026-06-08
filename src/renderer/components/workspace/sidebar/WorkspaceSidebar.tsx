import type React from "react";
import { ArrowUpDown, Database, Plus, RefreshCw, X } from "lucide-react";
import type { ServerProfile, TopicSummary } from "../../../../shared/types";
import type { DragPayload, TopicListFilter, TopicSortMode, WorkspaceActionTarget } from "../../../uiTypes";
import { topicSortOptions } from "../../../uiTypes";
import { getTopicSortLabel } from "../../../utils";
import { ServerPanel } from "./ServerPanel";
import { TopicListItem } from "../topics";

type DropTarget = { id: string; position: "before" | "after" } | null;
type TopicDropTarget = { topic: string; position: "before" | "after" } | null;

type WorkspaceSidebarProps = {
  serverPanelHeight: number;
  serverQuery: string;
  servers: ServerProfile[];
  filteredServers: ServerProfile[];
  selectedServerId: string;
  draggingServerId: string;
  serverDropTarget: DropTarget;
  connectedServerIds: string[];
  failedServerIds: string[];
  topics: TopicSummary[];
  filteredTopics: TopicSummary[];
  favoriteTopics: TopicSummary[];
  nonFavoriteFilteredTopics: TopicSummary[];
  favoriteTopicNames: string[];
  manualAvroTopicNames: Set<string>;
  selectedTopic: string;
  topicQuery: string;
  topicSearchHistory: string[];
  topicSearchError: string;
  topicFilter: TopicListFilter;
  topicSort: TopicSortMode;
  isTopicSortMenuOpen: boolean;
  isSelectedServerConnected: boolean;
  loading: boolean;
  draggingFavoriteTopic: string;
  favoriteDropTarget: TopicDropTarget;
  onNewServer: () => void;
  onServerQuery: (query: string) => void;
  onServerSelect: (serverId: string) => void;
  onServerContextMenu: (event: React.MouseEvent, server: ServerProfile) => void;
  onOpenServer: (server: ServerProfile) => void;
  onServerDragStart: (serverId: string) => void;
  onServerDropTarget: (target: DropTarget) => void;
  onServerDrop: (draggedId: string, targetId: string, position: "before" | "after") => void;
  onServerDragEnd: () => void;
  onServerPanelResize: (event: React.PointerEvent) => void;
  onTopicSortMenuOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  onTopicSort: (sort: TopicSortMode) => void;
  onRefreshTopics: () => void;
  onTopicQuery: (query: string) => void;
  onCommitTopicSearch: () => void;
  onRemoveTopicSearchHistory: (query: string) => void;
  onTopicFilter: (filter: TopicListFilter) => void;
  onTopicSelect: (target: WorkspaceActionTarget, topic: string) => void;
  onTopicOpen: (topic: string) => void;
  onTopicFavorite: (topic: string) => void;
  onTopicContextMenu: (event: React.MouseEvent, topic: string) => void;
  getWorkspaceTargetForTopic: (serverId: string, topic: string) => WorkspaceActionTarget;
  onFavoriteDragStart: (topic: string) => void;
  onFavoriteDropTarget: (target: TopicDropTarget) => void;
  onFavoriteDrop: (draggedTopic: string, targetTopic: string, position: "before" | "after") => void;
  onFavoriteDragEnd: () => void;
};

export function WorkspaceSidebar({
  serverPanelHeight,
  serverQuery,
  servers,
  filteredServers,
  selectedServerId,
  draggingServerId,
  serverDropTarget,
  connectedServerIds,
  failedServerIds,
  topics,
  filteredTopics,
  favoriteTopics,
  nonFavoriteFilteredTopics,
  favoriteTopicNames,
  manualAvroTopicNames,
  selectedTopic,
  topicQuery,
  topicSearchHistory,
  topicSearchError,
  topicFilter,
  topicSort,
  isTopicSortMenuOpen,
  isSelectedServerConnected,
  loading,
  draggingFavoriteTopic,
  favoriteDropTarget,
  onNewServer,
  onServerQuery,
  onServerSelect,
  onServerContextMenu,
  onOpenServer,
  onServerDragStart,
  onServerDropTarget,
  onServerDrop,
  onServerDragEnd,
  onServerPanelResize,
  onTopicSortMenuOpen,
  onTopicSort,
  onRefreshTopics,
  onTopicQuery,
  onCommitTopicSearch,
  onRemoveTopicSearchHistory,
  onTopicFilter,
  onTopicSelect,
  onTopicOpen,
  onTopicFavorite,
  onTopicContextMenu,
  getWorkspaceTargetForTopic,
  onFavoriteDragStart,
  onFavoriteDropTarget,
  onFavoriteDrop,
  onFavoriteDragEnd
}: WorkspaceSidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <Database size={24} />
        <div>
          <strong>Kafka Tool</strong>
          <span>Desktop client</span>
        </div>
        <button className="icon-button add-server" onClick={onNewServer} title="Add server">
          <Plus size={17} />
        </button>
      </div>

      <ServerPanel
        height={serverPanelHeight}
        query={serverQuery}
        servers={servers}
        filteredServers={filteredServers}
        selectedServerId={selectedServerId}
        draggingServerId={draggingServerId}
        serverDropTarget={serverDropTarget}
        connectedServerIds={connectedServerIds}
        failedServerIds={failedServerIds}
        onQuery={onServerQuery}
        onDragStart={(event, serverId) => {
          onServerDragStart(serverId);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", serverId);
        }}
        onDragOver={(_, serverId, position) => {
          if (draggingServerId && draggingServerId !== serverId) {
            onServerDropTarget({ id: serverId, position });
          }
        }}
        onDragLeave={(serverId) => {
          if (serverDropTarget?.id === serverId) {
            onServerDropTarget(null);
          }
        }}
        onDrop={(event, serverId) => {
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/plain") || draggingServerId;
          const position = serverDropTarget?.id === serverId ? serverDropTarget.position : "before";
          onServerDrop(draggedId, serverId, position);
        }}
        onDragEnd={onServerDragEnd}
        onSelect={onServerSelect}
        onContextMenu={onServerContextMenu}
        onOpen={onOpenServer}
      />

      <div className="sidebar-stack-resizer" onPointerDown={onServerPanelResize} title="Resize server/topic panels" />

      <section className="sidebar-panel topic-list">
        <div className="section-title">
          <h2>Topics</h2>
          <div className="topic-title-actions">
            <span>{filteredTopics.length}/{topics.length}</span>
            <div className="topic-sort-wrap" onClick={(event) => event.stopPropagation()}>
              <button
                className="topic-refresh"
                onClick={() => onTopicSortMenuOpen((current) => !current)}
                title={`Sort: ${getTopicSortLabel(topicSort)}`}
              >
                <ArrowUpDown size={14} />
              </button>
              {isTopicSortMenuOpen && (
                <div className="topic-sort-menu">
                  {topicSortOptions.map((option) => (
                    <button
                      key={option.value}
                      className={topicSort === option.value ? "active" : ""}
                      onClick={() => {
                        onTopicSort(option.value);
                        onTopicSortMenuOpen(false);
                      }}
                    >
                      <span>{topicSort === option.value ? "*" : ""}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="topic-refresh" onClick={onRefreshTopics} disabled={!isSelectedServerConnected || loading} title="Refresh topics">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        <div className="search-box topic-search">
          <input
            value={topicQuery}
            onChange={(event) => onTopicQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onCommitTopicSearch();
              }
            }}
            placeholder="Search topic"
            title="Space: AND, -word: exclude, /pattern/: regex"
          />
          {topicQuery && (
            <button onClick={() => onTopicQuery("")} title="Clear topic search">
              <X size={13} />
            </button>
          )}
        </div>
        {topicSearchError && <div className="topic-search-error">Invalid regex: {topicSearchError}</div>}
        {!topicSearchError && topicQuery.trim() && (
          <div className="topic-search-help">AND search, exclude with -word, regex with /pattern/</div>
        )}
        {topicSearchHistory.length > 0 && (
          <div className="topic-search-history">
            {topicSearchHistory.map((query) => (
              <button key={query} onClick={() => onTopicQuery(query)} title={`Search ${query}`}>
                <span>{query}</span>
                <X
                  size={12}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveTopicSearchHistory(query);
                  }}
                />
              </button>
            ))}
          </div>
        )}
        <div className="topic-filter-row">
          <select value={topicFilter} onChange={(event) => onTopicFilter(event.target.value as TopicListFilter)} title="Filter topics">
            <option value="all">All topics</option>
            <option value="favorites">Favorites</option>
            <option value="nonEmpty">Has messages</option>
          </select>
        </div>
        {favoriteTopics.length > 0 && (
          <div className={topicFilter === "favorites" ? "favorite-topic-section fill-available" : "favorite-topic-section"}>
            <div className="favorite-topic-title">Favorites</div>
            {favoriteTopics.map((topic) => (
              <TopicListItem
                key={topic.name}
                topic={topic}
                active={topic.name === selectedTopic}
                favorite
                hasAvroSchema={manualAvroTopicNames.has(topic.name)}
                onSelect={() => onTopicSelect(getWorkspaceTargetForTopic(selectedServerId, topic.name), topic.name)}
                onOpen={() => onTopicOpen(topic.name)}
                onToggleFavorite={() => onTopicFavorite(topic.name)}
                onContextMenu={(event) => onTopicContextMenu(event, topic.name)}
                draggable
                dragging={draggingFavoriteTopic === topic.name}
                dropPosition={favoriteDropTarget?.topic === topic.name ? favoriteDropTarget.position : null}
                onDragStart={(event) => {
                  onFavoriteDragStart(topic.name);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", topic.name);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  const rect = event.currentTarget.getBoundingClientRect();
                  onFavoriteDropTarget({
                    topic: topic.name,
                    position: event.clientY < rect.top + rect.height / 2 ? "before" : "after"
                  });
                }}
                onDragLeave={() => {
                  if (favoriteDropTarget?.topic === topic.name) {
                    onFavoriteDropTarget(null);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const draggedTopic = event.dataTransfer.getData("text/plain") || draggingFavoriteTopic;
                  const position = favoriteDropTarget?.topic === topic.name ? favoriteDropTarget.position : "before";
                  onFavoriteDrop(draggedTopic, topic.name, position);
                }}
                onDragEnd={onFavoriteDragEnd}
              />
            ))}
          </div>
        )}
        {(topicFilter !== "favorites" || filteredTopics.length === 0) && (
          <div className="topic-scroll">
            {nonFavoriteFilteredTopics.map((topic) => (
              <TopicListItem
                key={topic.name}
                topic={topic}
                active={topic.name === selectedTopic}
                favorite={favoriteTopicNames.includes(topic.name)}
                hasAvroSchema={manualAvroTopicNames.has(topic.name)}
                onSelect={() => onTopicSelect(getWorkspaceTargetForTopic(selectedServerId, topic.name), topic.name)}
                onOpen={() => onTopicOpen(topic.name)}
                onToggleFavorite={() => onTopicFavorite(topic.name)}
                onContextMenu={(event) => onTopicContextMenu(event, topic.name)}
              />
            ))}
            {filteredTopics.length === 0 && <div className="empty-list">No topics found</div>}
          </div>
        )}
      </section>
    </aside>
  );
}
