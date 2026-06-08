import { Braces, Copy, Layers, Pencil, Power, Trash2, Unplug } from "lucide-react";
import type { ServerProfile } from "../../../shared/types";
import type { ServerContextMenuState, TopicContextMenuState } from "../../hooks/useSidebarInteractionState";

type WorkspaceContextMenusProps = {
  topicContextMenu: TopicContextMenuState;
  serverContextMenu: ServerContextMenuState;
  contextTopic: string;
  contextServer: ServerProfile | undefined;
  selectedServerId: string;
  connectedServerIds: string[];
  onCloseTopicMenu: () => void;
  onOpenTopic: (topic: string) => void;
  onCopyTopic: (topic: string) => void;
  onRegisterAvroSchema: (serverId: string, topic: string) => void;
  onTopicAction: (kind: "delete" | "purge", topics: string[]) => void;
  onCloseServerMenu: () => void;
  onConnectServer: (server: ServerProfile) => void;
  onDisconnectServer: (serverId: string) => void;
  onEditServer: (server: ServerProfile) => void;
  onDeleteServer: (serverId: string) => void;
};

export function WorkspaceContextMenus({
  topicContextMenu,
  serverContextMenu,
  contextTopic,
  contextServer,
  selectedServerId,
  connectedServerIds,
  onCloseTopicMenu,
  onOpenTopic,
  onCopyTopic,
  onRegisterAvroSchema,
  onTopicAction,
  onCloseServerMenu,
  onConnectServer,
  onDisconnectServer,
  onEditServer,
  onDeleteServer
}: WorkspaceContextMenusProps) {
  return (
    <>
      {topicContextMenu && (
        <div
          className="context-menu topic-context-menu"
          style={{ left: topicContextMenu.x, top: topicContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button onClick={() => { onCloseTopicMenu(); onOpenTopic(contextTopic); }}>
            <Layers size={14} /> Open
          </button>
          <button onClick={() => { onCloseTopicMenu(); onCopyTopic(contextTopic); }}>
            <Copy size={14} /> Copy name
          </button>
          <button onClick={() => { onCloseTopicMenu(); onRegisterAvroSchema(selectedServerId, contextTopic); }}>
            <Braces size={14} /> Register Avro Schema
          </button>
          <button className="danger-item" onClick={() => { onCloseTopicMenu(); onTopicAction("purge", [contextTopic]); }}>
            <Trash2 size={14} /> Purge
          </button>
          <button className="danger-item" onClick={() => { onCloseTopicMenu(); onTopicAction("delete", [contextTopic]); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
      {serverContextMenu && contextServer && (
        <div
          className="context-menu"
          style={{ left: serverContextMenu.x, top: serverContextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {connectedServerIds.includes(contextServer.id) ? (
            <button onClick={() => { onCloseServerMenu(); onDisconnectServer(contextServer.id); }}>
              <Unplug size={14} /> Disconnect
            </button>
          ) : (
            <button onClick={() => { onCloseServerMenu(); onConnectServer(contextServer); }}>
              <Power size={14} /> Connect
            </button>
          )}
          <button onClick={() => { onCloseServerMenu(); onEditServer(contextServer); }}>
            <Pencil size={14} /> Edit
          </button>
          <button className="danger-item" onClick={() => { onCloseServerMenu(); onDeleteServer(contextServer.id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </>
  );
}
