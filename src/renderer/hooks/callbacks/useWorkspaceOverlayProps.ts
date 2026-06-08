import type { ServerProfile } from "../../../shared/types";
import type { WorkspaceAppLayoutOverlayProps } from "../../components/workspace/WorkspaceAppLayout";

type GeneratedOverlayHandlers =
  | "onConfirmTopicAction"
  | "onOpenTopic"
  | "onCopyTopic"
  | "onConnectServer"
  | "onDisconnectServer"
  | "onDeleteServer";

type WorkspaceOverlayPropsParams = Omit<WorkspaceAppLayoutOverlayProps, GeneratedOverlayHandlers> & {
  confirmTopicAction: () => Promise<void>;
  openTopicTab: (topic: string) => Promise<void>;
  copySelectedTopicNames: (topics?: string[]) => Promise<void>;
  connectServer: (server: ServerProfile) => Promise<unknown>;
  disconnectServer: (serverId: string) => Promise<void>;
  deleteServer: (serverId: string) => Promise<void>;
};

export function useWorkspaceOverlayProps({
  confirmTopicAction,
  openTopicTab,
  copySelectedTopicNames,
  connectServer,
  disconnectServer,
  deleteServer,
  ...overlayProps
}: WorkspaceOverlayPropsParams): WorkspaceAppLayoutOverlayProps {
  return {
    ...overlayProps,
    onConfirmTopicAction: () => void confirmTopicAction(),
    onOpenTopic: (topic) => void openTopicTab(topic),
    onCopyTopic: (topic) => void copySelectedTopicNames([topic]),
    onConnectServer: (server) => void connectServer(server),
    onDisconnectServer: (serverId) => void disconnectServer(serverId),
    onDeleteServer: (serverId) => void deleteServer(serverId)
  };
}
