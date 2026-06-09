import type { ServerProfile } from "../../../shared/types";
import type { WorkspaceAppLayoutSidebarProps } from "../../components/workspace/WorkspaceAppLayout";
import type { WorkspaceActionTarget } from "../../uiTypes";

type GeneratedSidebarHandlers =
  | "onOpenServer"
  | "onRefreshTopics"
  | "onTopicSelect"
  | "onTopicOpen";

type WorkspaceSidebarPropsParams = Omit<WorkspaceAppLayoutSidebarProps, GeneratedSidebarHandlers> & {
  openCluster: (server: ServerProfile) => Promise<unknown>;
  refreshTopics: () => Promise<unknown>;
  selectTopicInWorkspace: (target: WorkspaceActionTarget, topic: string) => Promise<unknown>;
  openTopicTab: (topic: string) => Promise<unknown>;
};

export function useWorkspaceSidebarProps({
  openCluster,
  refreshTopics,
  selectTopicInWorkspace,
  openTopicTab,
  ...sidebarProps
}: WorkspaceSidebarPropsParams): WorkspaceAppLayoutSidebarProps {
  return {
    ...sidebarProps,
    onOpenServer: (server) => void openCluster(server),
    onRefreshTopics: () => void refreshTopics(),
    onTopicSelect: (target, topic) => void selectTopicInWorkspace(target, topic),
    onTopicOpen: (topic) => void openTopicTab(topic)
  };
}
