import React from "react";
import { X } from "lucide-react";
import type { ServerProfile } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { ServerConnectionIndicator } from "../../ServerConnectionIndicator";

type ServerDropTarget = { id: string; position: "before" | "after" } | null;

type ServerPanelProps = {
  height: number;
  query: string;
  servers: ServerProfile[];
  filteredServers: ServerProfile[];
  selectedServerId: string;
  draggingServerId: string;
  serverDropTarget: ServerDropTarget;
  connectedServerIds: string[];
  failedServerIds: string[];
  onQuery: (query: string) => void;
  onDragStart: (event: React.DragEvent, serverId: string) => void;
  onDragOver: (event: React.DragEvent, serverId: string, position: "before" | "after") => void;
  onDragLeave: (serverId: string) => void;
  onDrop: (event: React.DragEvent, serverId: string) => void;
  onDragEnd: () => void;
  onSelect: (serverId: string) => void;
  onContextMenu: (event: React.MouseEvent, server: ServerProfile) => void;
  onOpen: (server: ServerProfile) => void;
};

export function ServerPanel(props: ServerPanelProps) {
  const language = useAppLanguage();
  return (
    <section className="sidebar-panel server-panel" style={{ height: props.height }}>
      <div className="sidebar-panel-title">
        <span>{t(language, "label.name")}</span>
        <span>{t(language, "label.server")}</span>
      </div>
      <div className="search-box server-search">
        <input
          value={props.query}
          onChange={(event) => props.onQuery(event.target.value)}
          placeholder={t(language, "placeholder.searchServer")}
        />
        {props.query && (
          <button onClick={() => props.onQuery("")} title={t(language, "title.clearServerSearch")}>
            <X size={13} />
          </button>
        )}
      </div>
      <div className="server-list">
        {props.filteredServers.map((server) => (
          <button
            key={server.id}
            className={`${server.id === props.selectedServerId ? "server active" : "server"} ${server.id === props.draggingServerId ? "dragging" : ""} ${props.serverDropTarget?.id === server.id ? `drop-${props.serverDropTarget.position}` : ""}`}
            draggable
            onDragStart={(event) => props.onDragStart(event, server.id)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              const rect = event.currentTarget.getBoundingClientRect();
              props.onDragOver(event, server.id, event.clientY < rect.top + rect.height / 2 ? "before" : "after");
            }}
            onDragLeave={() => props.onDragLeave(server.id)}
            onDrop={(event) => props.onDrop(event, server.id)}
            onDragEnd={props.onDragEnd}
            onClick={() => props.onSelect(server.id)}
            onContextMenu={(event) => props.onContextMenu(event, server)}
            onDoubleClick={() => props.onOpen(server)}
          >
            <span className="server-name">
              <ServerConnectionIndicator
                serverId={server.id}
                connectedServerIds={props.connectedServerIds}
                failedServerIds={props.failedServerIds}
              />
              <strong title={server.name}>{server.name}</strong>
            </span>
            <span className="server-host">
              <small title={server.brokers.join(", ")}>{server.brokers.join(", ")}</small>
            </span>
          </button>
        ))}
        {props.servers.length === 0 && <div className="empty-list">{t(language, "label.noServers")}</div>}
        {props.servers.length > 0 && props.filteredServers.length === 0 && <div className="empty-list">{t(language, "label.noServersFound")}</div>}
      </div>
    </section>
  );
}
