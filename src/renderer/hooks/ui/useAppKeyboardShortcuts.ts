import { useEffect } from "react";
import type { WorkspacePaneId } from "../../uiTypes";
import { matchesShortcut, type KeyboardShortcutMap } from "../../keyboardShortcuts";
import type { PreferencePage } from "../preferences/usePreferenceNavigation";

type AppKeyboardShortcutParams = {
  isQuickSearchOpen: boolean;
  quickSearchResultCount: number;
  selectedServerId: string;
  selectedTopic: string;
  activeWorkspacePane: WorkspacePaneId;
  splitPaneTopic: string;
  splitPaneOpen: boolean;
  keyboardShortcuts: KeyboardShortcutMap;
  openQuickSearch: () => void;
  closeQuickSearch: () => void;
  closeActiveTopicTab: () => Promise<void>;
  closeSplitPane: () => Promise<void>;
  openSplitForTopic: (serverId: string, topic: string) => Promise<void>;
  moveSplitTopicToPrimary: (topic: string) => Promise<void>;
  openPreferences: (page?: PreferencePage) => void;
  setActiveWorkspacePane: (value: WorkspacePaneId) => void;
  setSidebarCollapsed: (action: boolean | ((current: boolean) => boolean)) => void;
  setQuickSearchIndex: (action: number | ((current: number) => number)) => void;
};

function isEditableShortcutTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === "input" || tagName === "textarea" || tagName === "select" || target.isContentEditable;
}

export function useAppKeyboardShortcuts({
  isQuickSearchOpen,
  quickSearchResultCount,
  selectedServerId,
  selectedTopic,
  activeWorkspacePane,
  splitPaneTopic,
  splitPaneOpen,
  keyboardShortcuts,
  openQuickSearch,
  closeQuickSearch,
  closeActiveTopicTab,
  closeSplitPane,
  openSplitForTopic,
  moveSplitTopicToPrimary,
  openPreferences,
  setActiveWorkspacePane,
  setSidebarCollapsed,
  setQuickSearchIndex
}: AppKeyboardShortcutParams) {
  useEffect(() => {
    if (!isQuickSearchOpen) return;
    setQuickSearchIndex((current) => Math.min(current, Math.max(0, quickSearchResultCount - 1)));
  }, [isQuickSearchOpen, quickSearchResultCount, setQuickSearchIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasCommandModifier = event.ctrlKey || event.metaKey;
      if (matchesShortcut(event, keyboardShortcuts.quickSearch)) {
        event.preventDefault();
        openQuickSearch();
        return;
      }
      if (matchesShortcut(event, keyboardShortcuts.preferences)) {
        event.preventDefault();
        closeQuickSearch();
        openPreferences("editor-font");
        return;
      }
      if (matchesShortcut(event, keyboardShortcuts.toggleSidebar)) {
        event.preventDefault();
        closeQuickSearch();
        setSidebarCollapsed((current) => !current);
        return;
      }
      if (hasCommandModifier && !event.altKey && !isEditableShortcutTarget(event.target)) {
        if (matchesShortcut(event, keyboardShortcuts.splitTopic)) {
          event.preventDefault();
          closeQuickSearch();
          if (selectedServerId && selectedTopic) void openSplitForTopic(selectedServerId, selectedTopic);
          return;
        }
        if (matchesShortcut(event, keyboardShortcuts.sendTopicToLeftPane)) {
          event.preventDefault();
          closeQuickSearch();
          if (activeWorkspacePane === "split" && splitPaneOpen && splitPaneTopic) void moveSplitTopicToPrimary(splitPaneTopic);
          return;
        }
        if (matchesShortcut(event, keyboardShortcuts.focusPrimaryPane)) {
          event.preventDefault();
          closeQuickSearch();
          setActiveWorkspacePane("primary");
          return;
        }
        if (matchesShortcut(event, keyboardShortcuts.focusSplitPane)) {
          event.preventDefault();
          closeQuickSearch();
          if (splitPaneOpen) setActiveWorkspacePane("split");
          return;
        }
        if (matchesShortcut(event, keyboardShortcuts.closeActiveTopicTab)) {
          event.preventDefault();
          closeQuickSearch();
          void closeActiveTopicTab();
          return;
        }
        if (matchesShortcut(event, keyboardShortcuts.closeSplitPane) && splitPaneOpen) {
          event.preventDefault();
          closeQuickSearch();
          void closeSplitPane();
          return;
        }
      }
      if (!isQuickSearchOpen) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeQuickSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isQuickSearchOpen,
    quickSearchResultCount,
    selectedServerId,
    selectedTopic,
    activeWorkspacePane,
    splitPaneTopic,
    splitPaneOpen,
    keyboardShortcuts,
    openQuickSearch,
    closeQuickSearch,
    closeActiveTopicTab,
    closeSplitPane,
    openSplitForTopic,
    moveSplitTopicToPrimary,
    openPreferences,
    setActiveWorkspacePane,
    setSidebarCollapsed,
    setQuickSearchIndex
  ]);
}
