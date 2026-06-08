import type React from "react";
import { useEffect } from "react";
import { DEFAULT_FONT_FAMILY, useLayoutStore } from "../stores/ui/layoutStore";
import { sanitizeFontFamily } from "../utils";

export function useLayoutPreferences() {
  const sidebarWidth = useLayoutStore((state) => state.sidebarWidth);
  const setSidebarWidth = useLayoutStore((state) => state.setSidebarWidth);
  const sidebarCollapsed = useLayoutStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useLayoutStore((state) => state.setSidebarCollapsed);
  const serverPanelHeight = useLayoutStore((state) => state.serverPanelHeight);
  const setServerPanelHeight = useLayoutStore((state) => state.setServerPanelHeight);
  const messagePaneHeight = useLayoutStore((state) => state.messagePaneHeight);
  const setMessagePaneHeight = useLayoutStore((state) => state.setMessagePaneHeight);
  const fontFamily = useLayoutStore((state) => state.fontFamily);
  const setFontFamily = useLayoutStore((state) => state.setFontFamily);
  const fontSize = useLayoutStore((state) => state.fontSize);
  const setFontSize = useLayoutStore((state) => state.setFontSize);
  const exportFormatTemplate = useLayoutStore((state) => state.exportFormatTemplate);
  const setExportFormatTemplate = useLayoutStore((state) => state.setExportFormatTemplate);

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
    exportFormatTemplate,
    setExportFormatTemplate,
    startSidebarResize,
    startServerPanelResize
  };
}
