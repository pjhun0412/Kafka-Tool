import type { ConsumerGroupSummary, ManualAvroSchema, ServerProfile, TopicSummary } from "../shared/types";

export type QuickSearchKind = "server" | "topic" | "tab" | "avro" | "consumer" | "command";

export type QuickSearchResult = {
  id: string;
  kind: QuickSearchKind;
  title: string;
  subtitle: string;
  keywords: string;
  serverId?: string;
  topic?: string;
  groupId?: string;
  command?: string;
  recentKey?: string;
};

export type QuickSearchScopedQuery = {
  query: string;
  serverId?: string;
  serverToken?: string;
  serverSuggestions: ServerProfile[];
};

type BuildQuickSearchInput = {
  servers: ServerProfile[];
  topicsByServer: Record<string, TopicSummary[]>;
  openedTopicTabsByServer: Record<string, string[]>;
  manualAvroSchemasByServer: Record<string, Record<string, ManualAvroSchema>>;
  groupsByServer: Record<string, ConsumerGroupSummary[]>;
};

export function fuzzyScore(text: string, query: string) {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return 1;
  if (normalizedText.includes(normalizedQuery)) {
    return normalizedText.startsWith(normalizedQuery)
      ? 1000 - normalizedText.length
      : 700 - normalizedText.indexOf(normalizedQuery);
  }
  let score = 0;
  let cursor = 0;
  for (const char of normalizedQuery) {
    const index = normalizedText.indexOf(char, cursor);
    if (index < 0) return 0;
    score += index === cursor ? 8 : 3;
    cursor = index + 1;
  }
  return score;
}

function normalizeScopeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

export function parseQuickSearchScopedQuery(rawQuery: string, servers: ServerProfile[]): QuickSearchScopedQuery {
  const query = rawQuery.trim();
  if (!query.startsWith("@")) {
    return { query, serverSuggestions: [] };
  }

  const rest = query.slice(1).trimStart();
  const quoted = rest.match(/^"([^"]+)"\s*(.*)$/);
  if (quoted) {
    const serverToken = quoted[1];
    const server = servers.find((item) =>
      item.id === serverToken ||
      item.name === serverToken ||
      normalizeScopeText(item.name) === normalizeScopeText(serverToken)
    );
    return {
      query: quoted[2].trim(),
      serverId: server?.id,
      serverToken,
      serverSuggestions: server
        ? []
        : servers.filter((item) => normalizeScopeText(item.name).includes(normalizeScopeText(serverToken))).slice(0, 6)
    };
  }

  const normalizedRest = normalizeScopeText(rest);
  const matchedServer = servers
    .map((server) => {
      const candidates = [server.id, server.name, ...server.brokers].map(normalizeScopeText);
      const matchLength = candidates.find((candidate) => normalizedRest.startsWith(candidate))?.length ?? 0;
      return { server, matchLength };
    })
    .filter((item) => item.matchLength > 0)
    .sort((left, right) => right.matchLength - left.matchLength)[0]?.server;

  if (!matchedServer) {
    const [first = "", ...restParts] = rest.split(/\s+/);
    const suggestions = servers
      .map((server) => ({
        server,
        score: fuzzyScore(`${server.name} ${server.id} ${server.brokers.join(" ")}`, first || rest)
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6)
      .map((item) => item.server);
    return { query: restParts.join(" ").trim(), serverToken: first, serverSuggestions: suggestions };
  }

  const serverNamePattern = new RegExp(`^${matchedServer.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i");
  const serverIdPattern = new RegExp(`^${matchedServer.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i");
  const remaining = rest
    .replace(serverNamePattern, "")
    .replace(serverIdPattern, "")
    .trim();
  return {
    query: remaining,
    serverId: matchedServer.id,
    serverToken: matchedServer.name,
    serverSuggestions: []
  };
}

export function quickSearchCommands(): QuickSearchResult[] {
  return [
    { id: "command:settings", kind: "command", title: "Open Settings", subtitle: "Editor font settings", keywords: "settings preferences font editor", command: "settings" },
    { id: "command:avro-settings", kind: "command", title: "Open Avro Schemas", subtitle: "Manage registered Avro schemas", keywords: "settings avro schema registry", command: "avro-settings" },
    { id: "command:export-settings", kind: "command", title: "Open Log Export Format", subtitle: "Customize LOG download format", keywords: "settings export log format download", command: "export-settings" },
    { id: "command:refresh-topics", kind: "command", title: "Refresh Topics", subtitle: "Reload topics for selected server", keywords: "refresh reload topics", command: "refresh-topics" },
    { id: "command:refresh-groups", kind: "command", title: "Refresh Consumer Groups", subtitle: "Reload consumer groups for selected server", keywords: "refresh reload consumers groups", command: "refresh-groups" },
    { id: "command:consume-current", kind: "command", title: "Open Current Topic Consume", subtitle: "Switch selected topic to Consume", keywords: "consume current topic", command: "consume-current" },
    { id: "command:produce-current", kind: "command", title: "Open Current Topic Produce", subtitle: "Switch selected topic to Produce", keywords: "produce current topic", command: "produce-current" },
    { id: "command:delete-current", kind: "command", title: "Delete Current Topic", subtitle: "Open delete confirmation for selected topic", keywords: "delete remove current topic", command: "delete-current" },
    { id: "command:purge-current", kind: "command", title: "Purge Current Topic", subtitle: "Open purge confirmation for selected topic", keywords: "purge clear current topic messages", command: "purge-current" }
  ];
}

export function buildQuickSearchResults(input: BuildQuickSearchInput) {
  const results: QuickSearchResult[] = [];
  const serverNameById = new Map(input.servers.map((server) => [server.id, server.name]));

  for (const server of input.servers) {
    results.push({
      id: `server:${server.id}`,
      kind: "server",
      title: server.name,
      subtitle: server.brokers.join(", "),
      keywords: `${server.name} ${server.brokers.join(" ")}`,
      serverId: server.id,
      recentKey: `server:${server.id}`
    });
  }

  for (const [serverId, topics] of Object.entries(input.topicsByServer)) {
    const serverName = serverNameById.get(serverId) ?? serverId;
    for (const topic of topics) {
      results.push({
        id: `topic:${serverId}:${topic.name}`,
        kind: "topic",
        title: topic.name,
        subtitle: `${serverName} · P ${topic.partitions} / RF ${topic.replicationFactor}`,
        keywords: `${topic.name} ${serverName}`,
        serverId,
        topic: topic.name,
        recentKey: `topic:${serverId}:${topic.name}`
      });
    }
  }

  for (const [serverId, tabs] of Object.entries(input.openedTopicTabsByServer)) {
    const serverName = serverNameById.get(serverId) ?? serverId;
    for (const topic of tabs) {
      results.push({
        id: `tab:${serverId}:${topic}`,
        kind: "tab",
        title: topic,
        subtitle: `Opened tab · ${serverName}`,
        keywords: `${topic} opened tab ${serverName}`,
        serverId,
        topic,
        recentKey: `tab:${serverId}:${topic}`
      });
    }
  }

  for (const [serverId, schemas] of Object.entries(input.manualAvroSchemasByServer)) {
    const serverName = serverNameById.get(serverId) ?? serverId;
    for (const [topic, schema] of Object.entries(schemas)) {
      results.push({
        id: `avro:${serverId}:${topic}`,
        kind: "avro",
        title: topic,
        subtitle: `Avro schema · ${schema.encoding === "confluent" ? `Confluent #${schema.schemaId ?? "-"}` : "Raw"} · ${serverName}`,
        keywords: `${topic} avro schema ${schema.encoding} ${serverName}`,
        serverId,
        topic,
        recentKey: `avro:${serverId}:${topic}`
      });
    }
  }

  for (const [serverId, groups] of Object.entries(input.groupsByServer)) {
    const serverName = serverNameById.get(serverId) ?? serverId;
    for (const group of groups) {
      results.push({
        id: `consumer:${serverId}:${group.groupId}`,
        kind: "consumer",
        title: group.groupId,
        subtitle: `Consumer group · ${group.state ?? "UNKNOWN"} · ${serverName}`,
        keywords: `${group.groupId} consumer group ${group.state ?? ""} ${serverName}`,
        serverId,
        groupId: group.groupId,
        recentKey: `consumer:${serverId}:${group.groupId}`
      });
    }
  }

  return results;
}
