import type React from "react";
import type { TopicSummary } from "../../../../shared/types";
import type { TopicListFilter, TopicSortMode, WorkspaceActionTarget } from "../../../uiTypes";
import { TopicListItem } from "../topics";
import { TopicSearchControls } from "./TopicSearchControls";

type TopicDropTarget = { topic: string; position: "before" | "after" } | null;

export function TopicSidebarPanel(props: {
  topics: TopicSummary[];
  filteredTopics: TopicSummary[];
  favoriteTopics: TopicSummary[];
  nonFavoriteFilteredTopics: TopicSummary[];
  favoriteTopicNames: string[];
  manualAvroTopicNames: Set<string>;
  selectedServerId: string;
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
}) {
  return (
    <section className="sidebar-panel topic-list">
      <TopicSearchControls
        totalCount={props.topics.length}
        filteredCount={props.filteredTopics.length}
        query={props.topicQuery}
        searchHistory={props.topicSearchHistory}
        searchError={props.topicSearchError}
        filter={props.topicFilter}
        sort={props.topicSort}
        isSortMenuOpen={props.isTopicSortMenuOpen}
        isConnected={props.isSelectedServerConnected}
        loading={props.loading}
        onSortMenuOpen={props.onTopicSortMenuOpen}
        onSort={props.onTopicSort}
        onRefresh={props.onRefreshTopics}
        onQuery={props.onTopicQuery}
        onCommitSearch={props.onCommitTopicSearch}
        onRemoveSearchHistory={props.onRemoveTopicSearchHistory}
        onFilter={props.onTopicFilter}
      />
      {props.favoriteTopics.length > 0 && (
        <div className={props.topicFilter === "favorites" ? "favorite-topic-section fill-available" : "favorite-topic-section"}>
          <div className="favorite-topic-title">Favorites</div>
          {props.favoriteTopics.map((topic) => (
            <TopicListItem
              key={topic.name}
              topic={topic}
              active={topic.name === props.selectedTopic}
              favorite
              hasAvroSchema={props.manualAvroTopicNames.has(topic.name)}
              onSelect={() => props.onTopicSelect(props.getWorkspaceTargetForTopic(props.selectedServerId, topic.name), topic.name)}
              onOpen={() => props.onTopicOpen(topic.name)}
              onToggleFavorite={() => props.onTopicFavorite(topic.name)}
              onContextMenu={(event) => props.onTopicContextMenu(event, topic.name)}
              draggable
              dragging={props.draggingFavoriteTopic === topic.name}
              dropPosition={props.favoriteDropTarget?.topic === topic.name ? props.favoriteDropTarget.position : null}
              onDragStart={(event) => {
                props.onFavoriteDragStart(topic.name);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", topic.name);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                const rect = event.currentTarget.getBoundingClientRect();
                props.onFavoriteDropTarget({
                  topic: topic.name,
                  position: event.clientY < rect.top + rect.height / 2 ? "before" : "after"
                });
              }}
              onDragLeave={() => {
                if (props.favoriteDropTarget?.topic === topic.name) {
                  props.onFavoriteDropTarget(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                const draggedTopic = event.dataTransfer.getData("text/plain") || props.draggingFavoriteTopic;
                const position = props.favoriteDropTarget?.topic === topic.name ? props.favoriteDropTarget.position : "before";
                props.onFavoriteDrop(draggedTopic, topic.name, position);
              }}
              onDragEnd={props.onFavoriteDragEnd}
            />
          ))}
        </div>
      )}
      {(props.topicFilter !== "favorites" || props.filteredTopics.length === 0) && (
        <div className="topic-scroll">
          {props.nonFavoriteFilteredTopics.map((topic) => (
            <TopicListItem
              key={topic.name}
              topic={topic}
              active={topic.name === props.selectedTopic}
              favorite={props.favoriteTopicNames.includes(topic.name)}
              hasAvroSchema={props.manualAvroTopicNames.has(topic.name)}
              onSelect={() => props.onTopicSelect(props.getWorkspaceTargetForTopic(props.selectedServerId, topic.name), topic.name)}
              onOpen={() => props.onTopicOpen(topic.name)}
              onToggleFavorite={() => props.onTopicFavorite(topic.name)}
              onContextMenu={(event) => props.onTopicContextMenu(event, topic.name)}
            />
          ))}
          {props.filteredTopics.length === 0 && <div className="empty-list">No topics found</div>}
        </div>
      )}
    </section>
  );
}
