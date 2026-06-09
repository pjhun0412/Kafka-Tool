import { useEffect } from "react";
import type { PreferencePage } from "../preferences/usePreferenceNavigation";

type AppKeyboardShortcutParams = {
  isQuickSearchOpen: boolean;
  quickSearchResultCount: number;
  openQuickSearch: () => void;
  closeQuickSearch: () => void;
  openPreferences: (page?: PreferencePage) => void;
  setSidebarCollapsed: (action: boolean | ((current: boolean) => boolean)) => void;
  setQuickSearchIndex: (action: number | ((current: number) => number)) => void;
};

export function useAppKeyboardShortcuts({
  isQuickSearchOpen,
  quickSearchResultCount,
  openQuickSearch,
  closeQuickSearch,
  openPreferences,
  setSidebarCollapsed,
  setQuickSearchIndex
}: AppKeyboardShortcutParams) {
  useEffect(() => {
    if (!isQuickSearchOpen) return;
    setQuickSearchIndex((current) => Math.min(current, Math.max(0, quickSearchResultCount - 1)));
  }, [isQuickSearchOpen, quickSearchResultCount, setQuickSearchIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === "p" || key === "k")) {
        event.preventDefault();
        openQuickSearch();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        closeQuickSearch();
        openPreferences("editor-font");
        return;
      }
      if ((event.ctrlKey || event.metaKey) && key === "b") {
        event.preventDefault();
        closeQuickSearch();
        setSidebarCollapsed((current) => !current);
        return;
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
    openQuickSearch,
    closeQuickSearch,
    openPreferences,
    setSidebarCollapsed,
    setQuickSearchIndex
  ]);
}
