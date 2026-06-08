import { useEffect } from "react";
import type { PreferencePage } from "./usePreferenceNavigation";

type AppKeyboardShortcutParams = {
  isQuickSearchOpen: boolean;
  quickSearchResultCount: number;
  openQuickSearch: () => void;
  closeQuickSearch: () => void;
  openPreferences: (page?: PreferencePage) => void;
  setSidebarCollapsed: (action: boolean | ((current: boolean) => boolean)) => void;
  setQuickSearchIndex: (action: number | ((current: number) => number)) => void;
  executeQuickSearch: () => void | Promise<void>;
};

export function useAppKeyboardShortcuts({
  isQuickSearchOpen,
  quickSearchResultCount,
  openQuickSearch,
  closeQuickSearch,
  openPreferences,
  setSidebarCollapsed,
  setQuickSearchIndex,
  executeQuickSearch
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
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setQuickSearchIndex((current) => Math.min(current + 1, Math.max(0, quickSearchResultCount - 1)));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setQuickSearchIndex((current) => Math.max(0, current - 1));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        void executeQuickSearch();
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
    setQuickSearchIndex,
    executeQuickSearch
  ]);
}
