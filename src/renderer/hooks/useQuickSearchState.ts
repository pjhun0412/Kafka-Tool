import { useMemo } from "react";
import type { ConsumerGroupSummary, ManualAvroSchema, ServerProfile, TopicSummary } from "../../shared/types";
import {
  buildQuickSearchResults,
  fuzzyScore,
  parseQuickSearchScopedQuery,
  quickSearchCommands,
  type QuickSearchResult
} from "../quickSearch";
import { useSearchStore } from "../stores/ui/searchStore";

type QuickSearchStateParams = {
  servers: ServerProfile[];
  selectedServerId: string;
  topicsByServer: Record<string, TopicSummary[]>;
  openedTopicTabsByServer: Record<string, string[]>;
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
};

export function useQuickSearchState(params: QuickSearchStateParams) {
  const isQuickSearchOpen = useSearchStore((state) => state.isQuickSearchOpen);
  const quickSearchQuery = useSearchStore((state) => state.quickSearchQuery);
  const setQuickSearchQuery = useSearchStore((state) => state.setQuickSearchQuery);
  const quickSearchIndex = useSearchStore((state) => state.quickSearchIndex);
  const setQuickSearchIndex = useSearchStore((state) => state.setQuickSearchIndex);
  const quickSearchRecentKeys = useSearchStore((state) => state.quickSearchRecentKeys);
  const openQuickSearch = useSearchStore((state) => state.openQuickSearch);
  const closeQuickSearch = useSearchStore((state) => state.closeQuickSearch);
  const rememberQuickSearch = useSearchStore((state) => state.rememberQuickSearch);

  const quickSearchBaseResults = useMemo(
    () => buildQuickSearchResults({
      servers: params.servers,
      topicsByServer: params.topicsByServer,
      openedTopicTabsByServer: params.openedTopicTabsByServer,
      manualAvroSchemasByServer: params.manualAvroSchemasByServer,
      groupsByServer: params.groupsByServer
    }),
    [params.groupsByServer, params.manualAvroSchemasByServer, params.openedTopicTabsByServer, params.servers, params.topicsByServer]
  );

  const quickSearchResults = useMemo(() => {
    const rawQuery = quickSearchQuery.trim();
    const commandMode = rawQuery.startsWith(">");
    const scoped = parseQuickSearchScopedQuery(commandMode ? rawQuery.slice(1).trim() : rawQuery, params.servers);
    const query = scoped.query;
    const dynamicCommands: QuickSearchResult[] = [];
    const lowerCommand = commandMode ? query.toLowerCase() : "";
    const deleteMatch = lowerCommand.match(/^topic\s+(delete|purge)\s+(.+)$/);
    if (deleteMatch) {
      const action = deleteMatch[1];
      const topicName = query.slice(`topic ${action}`.length).trim();
      dynamicCommands.push({
        id: `command:${action}-topic:${topicName}`,
        kind: "command",
        title: `${action === "delete" ? "Delete" : "Purge"} topic ${topicName}`,
        subtitle: "Opens confirmation and refreshes the topic list after success",
        keywords: `topic ${action} ${topicName}`,
        command: `${action}-topic:${topicName}`,
        serverId: scoped.serverId || params.selectedServerId,
        topic: topicName
      });
    }
    const source = commandMode ? [...dynamicCommands, ...quickSearchCommands()] : [...quickSearchCommands(), ...quickSearchBaseResults];
    return source
      .filter((item) => !scoped.serverId || !item.serverId || item.serverId === scoped.serverId)
      .map((item) => {
        const score = fuzzyScore(`${item.title} ${item.subtitle} ${item.keywords}`, query);
        const recentBoost = item.recentKey && quickSearchRecentKeys.includes(item.recentKey) ? 120 - quickSearchRecentKeys.indexOf(item.recentKey) : 0;
        const commandBoost = item.kind === "command" ? 20 : 0;
        return { item, score: score + recentBoost + commandBoost };
      })
      .filter(({ score }) => !query || score > 0)
      .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title))
      .slice(0, 80)
      .map(({ item }) => item);
  }, [params.selectedServerId, params.servers, quickSearchBaseResults, quickSearchQuery, quickSearchRecentKeys]);

  const quickSearchScope = useMemo(
    () => parseQuickSearchScopedQuery(quickSearchQuery.trim().startsWith(">") ? quickSearchQuery.trim().slice(1) : quickSearchQuery, params.servers),
    [quickSearchQuery, params.servers]
  );

  return {
    isQuickSearchOpen,
    quickSearchQuery,
    setQuickSearchQuery,
    quickSearchIndex,
    setQuickSearchIndex,
    quickSearchResults,
    quickSearchScope,
    openQuickSearch,
    closeQuickSearch,
    rememberQuickSearch
  };
}
