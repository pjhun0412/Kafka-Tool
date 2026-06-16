import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  usePreferencesStore,
  type PreferenceGroup,
  type PreferencePage
} from "../../stores/ui/preferencesStore";

export type { PreferenceGroup, PreferencePage } from "../../stores/ui/preferencesStore";

export type PreferenceSearchMatches = {
  application: boolean;
  editor: boolean;
  consume: boolean;
  export: boolean;
  avro: boolean;
  pages: Set<PreferencePage>;
};

const allPreferencePages = new Set<PreferencePage>(["language", "diagnostics", "editor-font", "keyboard-shortcuts", "viewer-defaults", "export-log", "avro-schemas"]);

const preferenceSearchEntries: Array<{ group: PreferenceGroup; page: PreferencePage; keywords: string }> = [
  { group: "application", page: "language", keywords: "application language locale korean english system auto" },
  { group: "application", page: "diagnostics", keywords: "application diagnostics log logs retention error report folder troubleshooting" },
  { group: "editor", page: "editor-font", keywords: "editor font family size d2coding font" },
  { group: "editor", page: "keyboard-shortcuts", keywords: "keyboard shortcut shortcuts hotkey split quick search command ctrl cmd" },
  { group: "consume", page: "viewer-defaults", keywords: "consume viewer defaults message inspector raw tree preview key value format json text hex base64 encoding" },
  { group: "export", page: "export-log", keywords: "export log format download csv json" },
  { group: "avro", page: "avro-schemas", keywords: "avro schema schemas registry raw confluent" }
];

export function usePreferenceNavigation() {
  const {
    isPreferencesOpen,
    setIsPreferencesOpen,
    activePreferencesPage,
    setActivePreferencesPage,
    collapsedPreferenceGroups,
    setCollapsedPreferenceGroups,
    preferencesQuery,
    setPreferencesQuery,
    togglePreferenceGroup,
    openPreferences,
    openPreferencesSection
  } = usePreferencesStore(useShallow((state) => ({
    isPreferencesOpen: state.isPreferencesOpen,
    setIsPreferencesOpen: state.setIsPreferencesOpen,
    activePreferencesPage: state.activePreferencesPage,
    setActivePreferencesPage: state.setActivePreferencesPage,
    collapsedPreferenceGroups: state.collapsedPreferenceGroups,
    setCollapsedPreferenceGroups: state.setCollapsedPreferenceGroups,
    preferencesQuery: state.preferencesQuery,
    setPreferencesQuery: state.setPreferencesQuery,
    togglePreferenceGroup: state.togglePreferenceGroup,
    openPreferences: state.openPreferences,
    openPreferencesSection: state.openPreferencesSection
  })));

  const normalizedPreferencesQuery = preferencesQuery.trim().toLowerCase();
  const preferenceSearchMatches = useMemo<PreferenceSearchMatches>(() => {
    if (!normalizedPreferencesQuery) {
      return {
        application: true,
        editor: true,
        consume: true,
        export: true,
        avro: true,
        pages: allPreferencePages
      };
    }

    const matched = preferenceSearchEntries.filter((entry) => entry.keywords.toLowerCase().includes(normalizedPreferencesQuery));
    return {
      application: matched.some((entry) => entry.group === "application"),
      editor: matched.some((entry) => entry.group === "editor"),
      consume: matched.some((entry) => entry.group === "consume"),
      export: matched.some((entry) => entry.group === "export"),
      avro: matched.some((entry) => entry.group === "avro"),
      pages: new Set<PreferencePage>(matched.map((entry) => entry.page))
    };
  }, [normalizedPreferencesQuery]);

  useEffect(() => {
    if (!normalizedPreferencesQuery || preferenceSearchMatches.pages.has(activePreferencesPage)) return;
    const nextPage = preferenceSearchMatches.pages.values().next().value as PreferencePage | undefined;
    if (nextPage) {
      setActivePreferencesPage(nextPage);
    }
  }, [activePreferencesPage, normalizedPreferencesQuery, preferenceSearchMatches.pages]);

  return {
    isPreferencesOpen,
    setIsPreferencesOpen,
    activePreferencesPage,
    setActivePreferencesPage,
    collapsedPreferenceGroups,
    setCollapsedPreferenceGroups,
    preferencesQuery,
    setPreferencesQuery,
    normalizedPreferencesQuery,
    preferenceSearchMatches,
    togglePreferenceGroup,
    openPreferences,
    openPreferencesSection
  };
}
