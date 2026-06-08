import type { ServerProfile } from "../../shared/types";

type WorkspaceOverlayCallbacksParams = {
  confirmTopicAction: () => Promise<void>;
  openTopicTab: (topic: string) => Promise<void>;
  copySelectedTopicNames: (topics?: string[]) => Promise<void>;
  connectServer: (server: ServerProfile) => Promise<unknown>;
  disconnectServer: (serverId: string) => Promise<void>;
  deleteServer: (serverId: string) => Promise<void>;
};

export function useWorkspaceOverlayCallbacks({
  confirmTopicAction,
  openTopicTab,
  copySelectedTopicNames,
  connectServer,
  disconnectServer,
  deleteServer
}: WorkspaceOverlayCallbacksParams) {
  return {
    confirmTopicAction: () => void confirmTopicAction(),
    openTopic: (topic: string) => void openTopicTab(topic),
    copyTopic: (topic: string) => void copySelectedTopicNames([topic]),
    connectServer: (server: ServerProfile) => void connectServer(server),
    disconnectServer: (serverId: string) => void disconnectServer(serverId),
    deleteServer: (serverId: string) => void deleteServer(serverId)
  };
}
