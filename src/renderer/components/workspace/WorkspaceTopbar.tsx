import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { ServerProfile } from "../../../shared/types";

export function WorkspaceTopbar(props: {
  server?: ServerProfile;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <button
          className={props.sidebarCollapsed ? "sidebar-toggle collapsed" : "sidebar-toggle"}
          onClick={props.onToggleSidebar}
          title={props.sidebarCollapsed ? "Open sidebar (Ctrl+B)" : "Close sidebar (Ctrl+B)"}
          aria-label={props.sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
        >
          {props.sidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>
        <div>
          <span className="eyebrow" title={props.server ? props.server.brokers.join(", ") : "no server"}>
            {props.server ? props.server.brokers.join(", ") : "no server"}
          </span>
          <h1>{props.server?.name ?? "Kafka Server"}</h1>
        </div>
      </div>
    </header>
  );
}
