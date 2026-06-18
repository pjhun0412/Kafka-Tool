import type { AppPreferences } from "../shared/types";
import type { TopicConsumeState } from "./uiTypes";

export const DEFAULT_VIEWER_PREFERENCE_RETENTION_DAYS = 90;
export const DEFAULT_VIEWER_FONT_SIZE = 13;
export const DEFAULT_VIEWER_FONT_WEIGHT = 600;
const DAY_MS = 24 * 60 * 60 * 1000;

export type ViewerPreferences = NonNullable<AppPreferences["viewerPreferences"]>;
export type ViewerPreferencesByServer = NonNullable<ViewerPreferences["byServer"]>;
export type TopicViewerPreference = ViewerPreferencesByServer[string][string];
export type ViewerPreferencePatch = Pick<TopicConsumeState, "inspectorMode" | "keyFormat" | "valueFormat" | "payloadEncoding">;

const viewerPreferenceKeys = ["inspectorMode", "keyFormat", "valueFormat", "payloadEncoding"] as const;

export function normalizeViewerPreferences(preferences?: AppPreferences["viewerPreferences"]): Required<ViewerPreferences> {
  return {
    retentionDays: typeof preferences?.retentionDays === "number" ? preferences.retentionDays : DEFAULT_VIEWER_PREFERENCE_RETENTION_DAYS,
    fontSize: typeof preferences?.fontSize === "number" ? Math.min(18, Math.max(11, preferences.fontSize)) : DEFAULT_VIEWER_FONT_SIZE,
    fontWeight: typeof preferences?.fontWeight === "number" ? Math.min(800, Math.max(400, preferences.fontWeight)) : DEFAULT_VIEWER_FONT_WEIGHT,
    byServer: preferences?.byServer ?? {}
  };
}

export function pruneViewerPreferences(preferences?: AppPreferences["viewerPreferences"], now = Date.now()): Required<ViewerPreferences> {
  const normalized = normalizeViewerPreferences(preferences);
  if (normalized.retentionDays <= 0) return normalized;

  const threshold = now - normalized.retentionDays * DAY_MS;
  const byServer = Object.fromEntries(
    Object.entries(normalized.byServer)
      .map(([serverId, topics]) => {
        const keptTopics = Object.fromEntries(
          Object.entries(topics).filter(([, value]) => (value.updatedAt ?? 0) >= threshold)
        );
        return [serverId, keptTopics] as const;
      })
      .filter(([, topics]) => Object.keys(topics).length > 0)
  );

  return {
    ...normalized,
    byServer
  };
}

export function getViewerPreferenceOverride(
  preferences: AppPreferences["viewerPreferences"],
  serverId: string,
  topic: string
): Partial<ViewerPreferencePatch> {
  if (!serverId || !topic) return {};
  const stored = preferences?.byServer?.[serverId]?.[topic];
  if (!stored) return {};
  return {
    inspectorMode: stored.inspectorMode,
    keyFormat: stored.keyFormat,
    valueFormat: stored.valueFormat,
    payloadEncoding: stored.payloadEncoding
  };
}

export function updateTopicViewerPreference(params: {
  current: Required<ViewerPreferences>;
  serverId: string;
  topic: string;
  baseline: ViewerPreferencePatch;
  patch: Partial<TopicConsumeState>;
  now?: number;
}): Required<ViewerPreferences> {
  if (!params.serverId || !params.topic) return params.current;
  const viewerPatch = Object.fromEntries(
    viewerPreferenceKeys
      .filter((key) => params.patch[key] !== undefined)
      .map((key) => [key, params.patch[key]])
  ) as Partial<ViewerPreferencePatch>;
  if (Object.keys(viewerPatch).length === 0) return params.current;

  const existing = params.current.byServer[params.serverId]?.[params.topic] ?? {};
  const merged = {
    ...existing,
    ...viewerPatch
  };
  const nextPreference = Object.fromEntries(
    viewerPreferenceKeys
      .filter((key) => merged[key] !== undefined && merged[key] !== params.baseline[key])
      .map((key) => [key, merged[key]])
  ) as Partial<ViewerPreferencePatch>;

  const nextServer = { ...(params.current.byServer[params.serverId] ?? {}) };
  if (Object.keys(nextPreference).length === 0) {
    delete nextServer[params.topic];
  } else {
    nextServer[params.topic] = {
      ...nextPreference,
      updatedAt: params.now ?? Date.now()
    };
  }

  const nextByServer = { ...params.current.byServer };
  if (Object.keys(nextServer).length === 0) {
    delete nextByServer[params.serverId];
  } else {
    nextByServer[params.serverId] = nextServer;
  }

  return pruneViewerPreferences({
    ...params.current,
    byServer: nextByServer
  });
}
