import type React from "react";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { resolveLanguage } from "../../i18n";
import { DEFAULT_FONT_FAMILY, useLayoutStore } from "../../stores/ui/layoutStore";
import { sanitizeFontFamily } from "../../utils";

export function useLayoutPreferences() {
  const {
    sidebarWidth,
    setSidebarWidth,
    sidebarCollapsed,
    setSidebarCollapsed,
    serverPanelHeight,
    setServerPanelHeight,
    messagePaneHeight,
    setMessagePaneHeight,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    language,
    setLanguage,
    exportFormatTemplate,
    setExportFormatTemplate
  } = useLayoutStore(useShallow((state) => ({
    sidebarWidth: state.sidebarWidth,
    setSidebarWidth: state.setSidebarWidth,
    sidebarCollapsed: state.sidebarCollapsed,
    setSidebarCollapsed: state.setSidebarCollapsed,
    serverPanelHeight: state.serverPanelHeight,
    setServerPanelHeight: state.setServerPanelHeight,
    messagePaneHeight: state.messagePaneHeight,
    setMessagePaneHeight: state.setMessagePaneHeight,
    fontFamily: state.fontFamily,
    setFontFamily: state.setFontFamily,
    fontSize: state.fontSize,
    setFontSize: state.setFontSize,
    language: state.language,
    setLanguage: state.setLanguage,
    exportFormatTemplate: state.exportFormatTemplate,
    setExportFormatTemplate: state.setExportFormatTemplate
  })));
  const resolvedLanguage = resolveLanguage(language);

  useEffect(() => {
    const safeFontFamily = sanitizeFontFamily(fontFamily) || DEFAULT_FONT_FAMILY;
    document.documentElement.style.setProperty("--app-font-family", safeFontFamily);
    document.documentElement.style.setProperty("--app-mono-font-family", safeFontFamily);
    document.documentElement.style.setProperty("--app-font-size", `${Math.min(16, Math.max(11, fontSize))}px`);
  }, [fontFamily, fontSize]);

  function startSidebarResize(event: React.PointerEvent<Element>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;
    const onMove = (moveEvent: PointerEvent) => {
      const nextWidth = Math.min(420, Math.max(230, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function startServerPanelResize(event: React.PointerEvent<Element>) {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = serverPanelHeight;
    const onMove = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(190, window.innerHeight - 330);
      const nextHeight = Math.min(maxHeight, Math.max(170, startHeight + moveEvent.clientY - startY));
      setServerPanelHeight(nextHeight);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return {
    sidebarWidth,
    setSidebarWidth,
    sidebarCollapsed,
    setSidebarCollapsed,
    serverPanelHeight,
    setServerPanelHeight,
    messagePaneHeight,
    setMessagePaneHeight,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    language,
    setLanguage,
    resolvedLanguage,
    exportFormatTemplate,
    setExportFormatTemplate,
    startSidebarResize,
    startServerPanelResize
  };
}
