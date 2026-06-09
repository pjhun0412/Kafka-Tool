import { useEffect, useRef, useState } from "react";
import { Braces, HardDrive, Layers, ListTree, MoreVertical, Play, RefreshCw, Send, Settings, Users } from "lucide-react";
import type { View } from "../../../uiTypes";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

const topicWorkViews: View[] = ["info", "consume", "produce", "settings"];
const serverWorkViews: View[] = ["brokers", "topics", "consumers"];

export function ServerWorkTabs(props: {
  activeView: View;
  disabled: boolean;
  loading: boolean;
  onView: (view: View) => void;
  onRefresh: () => void;
}) {
  const language = useAppLanguage();
  return (
    <nav className="tabs server-work-tabs" onMouseDown={(event) => event.stopPropagation()}>
      {serverWorkViews.map((view) => (
        <button
          key={view}
          className={props.activeView === view ? "active" : ""}
          onClick={() => props.onView(view)}
          disabled={props.disabled}
        >
          {view === "brokers" && <HardDrive size={16} />}
          {view === "topics" && <ListTree size={16} />}
          {view === "consumers" && <Users size={16} />}
          {view === "brokers" ? "Brokers" : view === "topics" ? "Topics" : "Consumers"}
        </button>
      ))}
      <button className="ghost" onClick={props.onRefresh} disabled={props.disabled || props.loading}>
        <RefreshCw size={16} /> {t(language, "label.refresh")}
      </button>
    </nav>
  );
}

export function TopicWorkTabs(props: {
  activeView: View;
  disabled: boolean;
  refreshDisabled: boolean;
  onView: (view: View) => void;
  onOpenSchema: () => void;
  onRefresh: () => void;
  onEditSettings: () => void;
}) {
  const language = useAppLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function closeMenu(event: MouseEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    window.addEventListener("mousedown", closeMenu);
    return () => window.removeEventListener("mousedown", closeMenu);
  }, [menuOpen]);

  return (
    <nav className="tabs topic-work-tabs">
      {topicWorkViews.map((view) => (
        <button key={view} className={props.activeView === view ? "active" : ""} onClick={() => props.onView(view)} disabled={props.disabled}>
          {view === "info" && <Layers size={16} />}
          {view === "consume" && <Play size={16} />}
          {view === "produce" && <Send size={16} />}
          {view === "settings" && <Settings size={16} />}
          {view === "info" ? "Info" : view === "consume" ? "Consume" : view === "produce" ? "Produce" : "Settings"}
        </button>
      ))}
      <button className="ghost schema-button refresh-side" onClick={props.onOpenSchema} disabled={props.disabled}>
        <Braces size={16} /> Schema
      </button>
      <button className="ghost" onClick={props.onRefresh} disabled={props.refreshDisabled}>
        <RefreshCw size={16} /> {t(language, "label.refresh")}
      </button>
      <div className="topic-action-menu-wrap" ref={menuRef}>
        <button
          className={menuOpen ? "ghost icon-only topic-menu-button active" : "ghost icon-only topic-menu-button"}
          type="button"
          title={t(language, "title.topicActions")}
          disabled={props.disabled}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div className="topic-action-menu">
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                props.onEditSettings();
              }}
            >
              {t(language, "action.editSettings")}
              <span>{t(language, "label.topicSettingsEditDescription")}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
