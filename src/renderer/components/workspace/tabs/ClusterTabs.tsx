import { X } from "lucide-react";
import type { ServerProfile } from "../../../../shared/types";
import { ServerConnectionIndicator } from "../../ServerConnectionIndicator";

export function ClusterTabs(props: {
  openClusterIds: string[];
  servers: ServerProfile[];
  selectedServerId: string;
  connectedServerIds: string[];
  failedServerIds: string[];
  onSelect: (serverId: string) => void;
  onClose: (serverId: string) => void;
}) {
  return (
    <div className="cluster-tabs" aria-label="Opened clusters">
      {props.openClusterIds.length === 0 ? (
        <div className="cluster-tabs-empty">좌측 서버를 connect 하거나 더블 클릭하면 클러스터 탭으로 열립니다.</div>
      ) : (
        props.openClusterIds.map((serverId) => {
          const server = props.servers.find((item) => item.id === serverId);
          if (!server) return null;
          return (
            <button
              key={serverId}
              className={serverId === props.selectedServerId ? "cluster-tab active" : "cluster-tab"}
              onClick={() => props.onSelect(serverId)}
              onAuxClick={(event) => {
                if (event.button === 1) {
                  event.preventDefault();
                  props.onClose(serverId);
                }
              }}
              title={`${server.name} (${server.brokers.join(", ")})`}
            >
              <ServerConnectionIndicator
                serverId={serverId}
                connectedServerIds={props.connectedServerIds}
                failedServerIds={props.failedServerIds}
                variant="dot"
              />
              <span className="cluster-tab-name">{server.name}</span>
              <X size={14} onClick={(event) => { event.stopPropagation(); props.onClose(serverId); }} />
            </button>
          );
        })
      )}
    </div>
  );
}
