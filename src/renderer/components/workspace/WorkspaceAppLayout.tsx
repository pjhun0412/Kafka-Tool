import type { ComponentProps } from "react";
import { PrimaryWorkspacePane } from "./primary/PrimaryWorkspacePane";
import { WorkspaceSidebar } from "./sidebar/WorkspaceSidebar";
import { SplitWorkspacePane } from "./split/SplitWorkspacePane";
import { WorkspaceLayout } from "./WorkspaceLayout";
import { WorkspaceOverlays } from "./WorkspaceOverlays";

type WorkspaceLayoutBaseProps = Omit<ComponentProps<typeof WorkspaceLayout>, "sidebar" | "primaryPane" | "splitPane" | "overlays">;

export type WorkspaceAppLayoutSidebarProps = ComponentProps<typeof WorkspaceSidebar>;
export type WorkspaceAppLayoutPrimaryPaneProps = ComponentProps<typeof PrimaryWorkspacePane>;
export type WorkspaceAppLayoutSplitPaneProps = ComponentProps<typeof SplitWorkspacePane>;
export type WorkspaceAppLayoutOverlayProps = ComponentProps<typeof WorkspaceOverlays>;

type WorkspaceAppLayoutProps = WorkspaceLayoutBaseProps & {
  sidebarProps: WorkspaceAppLayoutSidebarProps;
  primaryPaneProps: WorkspaceAppLayoutPrimaryPaneProps;
  splitPaneProps: WorkspaceAppLayoutSplitPaneProps | null;
  overlayProps: WorkspaceAppLayoutOverlayProps;
};

export function WorkspaceAppLayout({
  sidebarProps,
  primaryPaneProps,
  splitPaneProps,
  overlayProps,
  ...layoutProps
}: WorkspaceAppLayoutProps) {
  return (
    <WorkspaceLayout
      {...layoutProps}
      sidebar={<WorkspaceSidebar {...sidebarProps} />}
      primaryPane={<PrimaryWorkspacePane {...primaryPaneProps} />}
      splitPane={splitPaneProps ? <SplitWorkspacePane {...splitPaneProps} /> : null}
      overlays={<WorkspaceOverlays {...overlayProps} />}
    />
  );
}
