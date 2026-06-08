import { Braces, HardDrive, Layers, ListTree, Play, RefreshCw, Send, Users } from "lucide-react";
import type { View } from "../../../uiTypes";

const topicWorkViews: View[] = ["info", "consume", "produce"];
const serverWorkViews: View[] = ["brokers", "topics", "consumers"];

export function ServerWorkTabs(props: {
  activeView: View;
  disabled: boolean;
  loading: boolean;
  onView: (view: View) => void;
  onRefresh: () => void;
}) {
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
        <RefreshCw size={16} /> 새로고침
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
}) {
  return (
    <nav className="tabs topic-work-tabs">
      {topicWorkViews.map((view) => (
        <button key={view} className={props.activeView === view ? "active" : ""} onClick={() => props.onView(view)} disabled={props.disabled}>
          {view === "info" && <Layers size={16} />}
          {view === "consume" && <Play size={16} />}
          {view === "produce" && <Send size={16} />}
          {view === "info" ? "Info" : view === "consume" ? "Consume" : "Produce"}
        </button>
      ))}
      <button className="ghost schema-button refresh-side" onClick={props.onOpenSchema} disabled={props.disabled}>
        <Braces size={16} /> Schema
      </button>
      <button className="ghost" onClick={props.onRefresh} disabled={props.refreshDisabled}>
        <RefreshCw size={16} /> 새로고침
      </button>
    </nav>
  );
}
