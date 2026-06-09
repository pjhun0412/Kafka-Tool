import type { TopicSummary } from "../shared/types";

export type TopicListFilter = "all" | "favorites" | "nonEmpty";
export type TopicSortMode = "nameAsc" | "messagesDesc" | "partitionsDesc" | "favoritesFirst";
export type TopicAction = { serverId: string; kind: "delete" | "purge"; topics: string[] } | null;

export const topicSortOptions: Array<{ value: TopicSortMode; label: string }> = [
  { value: "nameAsc", label: "Name A-Z" },
  { value: "messagesDesc", label: "Messages High-Low" },
  { value: "partitionsDesc", label: "Partitions High-Low" },
  { value: "favoritesFirst", label: "Favorites first" }
];

export type TopicSorter = (topics: TopicSummary[], sortMode: TopicSortMode, favoriteTopicNames: string[]) => TopicSummary[];
