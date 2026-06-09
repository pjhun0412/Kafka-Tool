import type React from "react";
import type { SplitDropSide } from "../../hooks/state/useWorkspacePaneState";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";

type WorkspaceLayoutProps = {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  splitMode: boolean;
  splitPrimaryPercent: number;
  splitDropSide: SplitDropSide;
  sidebar: React.ReactNode;
  primaryPane: React.ReactNode;
  splitPane: React.ReactNode;
  overlays: React.ReactNode;
  onSidebarResize: (event: React.PointerEvent<HTMLDivElement>) => void;
  onWorkspaceSplitResize: (event: React.PointerEvent<HTMLDivElement>) => void;
  onWorkspaceDragOver: (event: React.DragEvent<HTMLElement>) => void;
  onWorkspaceDragLeave: () => void;
  onWorkspaceDrop: (event: React.DragEvent<HTMLElement>) => void;
};

export function WorkspaceLayout({
  sidebarCollapsed,
  sidebarWidth,
  splitMode,
  splitPrimaryPercent,
  splitDropSide,
  sidebar,
  primaryPane,
  splitPane,
  overlays,
  onSidebarResize,
  onWorkspaceSplitResize,
  onWorkspaceDragOver,
  onWorkspaceDragLeave,
  onWorkspaceDrop
}: WorkspaceLayoutProps) {
  const language = useAppLanguage();
  return (
    <div
      className={sidebarCollapsed ? "app-shell sidebar-collapsed" : "app-shell"}
      style={{ gridTemplateColumns: sidebarCollapsed ? "minmax(0, 1fr)" : `${sidebarWidth}px 6px minmax(0, 1fr)` }}
    >
      {sidebar}

      <div className="sidebar-resizer" onPointerDown={onSidebarResize} title={t(language, "title.resizeSidebar")} />

      <main
        className={splitMode ? "workspace split-mode" : "workspace"}
        style={splitMode ? { gridTemplateColumns: `${splitPrimaryPercent}fr 8px ${100 - splitPrimaryPercent}fr` } : undefined}
        onDragOver={onWorkspaceDragOver}
        onDragLeave={onWorkspaceDragLeave}
        onDrop={onWorkspaceDrop}
      >
        {splitDropSide && (
          <div className={`split-drop-indicator ${splitDropSide}`}>
            {splitDropSide === "right" ? t(language, "workspace.dropToSplit") : t(language, "workspace.dropToCloseSplit")}
          </div>
        )}
        {primaryPane}
        {splitMode && <div className="workspace-split-resizer" onPointerDown={onWorkspaceSplitResize} title={t(language, "title.resizeSplitPanes")} />}
        {splitPane}
      </main>

      {overlays}
    </div>
  );
}
