export const TOPIC_SEARCH_HISTORY_LIMIT = 6;

export type ParsedTopicSearchQuery = {
  include: string[];
  exclude: string[];
  regex: RegExp | null;
  error: string;
};

export function parseTopicSearchQuery(query: string): ParsedTopicSearchQuery {
  const trimmed = query.trim();
  if (!trimmed) {
    return { include: [], exclude: [], regex: null, error: "" };
  }

  if (trimmed.startsWith("/") && trimmed.lastIndexOf("/") > 0) {
    const lastSlash = trimmed.lastIndexOf("/");
    const pattern = trimmed.slice(1, lastSlash);
    const flags = trimmed.slice(lastSlash + 1) || "i";
    try {
      return { include: [], exclude: [], regex: new RegExp(pattern, flags), error: "" };
    } catch (error) {
      return { include: [], exclude: [], regex: null, error: error instanceof Error ? error.message : String(error) };
    }
  }

  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  return {
    include: tokens.filter((token) => !token.startsWith("-")),
    exclude: tokens.filter((token) => token.startsWith("-") && token.length > 1).map((token) => token.slice(1)),
    regex: null,
    error: ""
  };
}

export function matchesTopicSearch(topicName: string, query: ParsedTopicSearchQuery) {
  if (query.error) return false;
  if (query.regex) return query.regex.test(topicName);
  const normalizedName = topicName.toLowerCase();
  return query.include.every((token) => normalizedName.includes(token)) &&
    query.exclude.every((token) => !normalizedName.includes(token));
}
