import type { ServerProfile } from "../../shared/types";

type WorkspaceOverlayCallbacksParams = {
  setIsPreferencesOpen: (open: boolean) => void;
  openManualAvroSchema: (serverId: string, topic: string) => void;
  setConnectionError: (error: null) => void;
  setPendingTopicAction: (action: null) => void;
  confirmTopicAction: () => Promise<void>;
  openTopicTab: (topic: string) => Promise<void>;
  copySelectedTopicNames: (topics?: string[]) => Promise<void>;
  connectServer: (server: ServerProfile) => Promise<unknown>;
  disconnectServer: (serverId: string) => Promise<void>;
  deleteServer: (serverId: string) => Promise<void>;
};

export function useWorkspaceOverlayCallbacks({
  setIsPreferencesOpen,
  openManualAvroSchema,
  setConnectionError,
  setPendingTopicAction,
  confirmTopicAction,
  openTopicTab,
  copySelectedTopicNames,
  connectServer,
  disconnectServer,
  deleteServer
}: WorkspaceOverlayCallbacksParams) {
  return {
    openManualAvroFromPreferences: (serverId: string, topic: string) => {
      setIsPreferencesOpen(false);
      openManualAvroSchema(serverId, topic);
    },
    closePreferences: () => setIsPreferencesOpen(false),
    closeConnectionError: () => setConnectionError(null),
    closeTopicAction: () => setPendingTopicAction(null),
    confirmTopicAction: () => void confirmTopicAction(),
    openTopic: (topic: string) => void openTopicTab(topic),
    copyTopic: (topic: string) => void copySelectedTopicNames([topic]),
    connectServer: (server: ServerProfile) => void connectServer(server),
    disconnectServer: (serverId: string) => void disconnectServer(serverId),
    deleteServer: (serverId: string) => void deleteServer(serverId)
  };
}
