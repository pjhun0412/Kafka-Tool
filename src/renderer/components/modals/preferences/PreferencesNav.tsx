import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import type { ManualAvroSchemaRow } from "../../../hooks/preferences/useManualAvroSchemaSummary";
import type { PreferenceGroup, PreferencePage, PreferenceSearchMatches } from "../../../hooks/preferences/usePreferenceNavigation";

export function PreferencesNav(props: {
  activePage: PreferencePage;
  collapsedGroups: Record<PreferenceGroup, boolean>;
  query: string;
  normalizedQuery: string;
  matches: PreferenceSearchMatches;
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onActivePage: (page: PreferencePage) => void;
  onToggleGroup: (group: PreferenceGroup) => void;
  onQuery: (query: string) => void;
}) {
  return (
    <aside className="preferences-nav" aria-label="Preference sections">
      <div className="preferences-search">
        <Filter size={14} />
        <input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder="Search settings" />
        {props.query && (
          <button onClick={() => props.onQuery("")} title="Clear settings search">
            <X size={13} />
          </button>
        )}
      </div>
      {props.matches.editor && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("editor")} aria-expanded={!props.collapsedGroups.editor}>
            {props.collapsedGroups.editor && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Editor
          </button>
          {(!props.collapsedGroups.editor || props.normalizedQuery) && props.matches.pages.has("editor-font") && (
            <button className={props.activePage === "editor-font" ? "active child" : "child"} onClick={() => props.onActivePage("editor-font")}>
              <span>Font</span>
              <small>Family and size</small>
            </button>
          )}
        </div>
      )}
      {props.matches.export && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("export")} aria-expanded={!props.collapsedGroups.export}>
            {props.collapsedGroups.export && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Export
          </button>
          {(!props.collapsedGroups.export || props.normalizedQuery) && props.matches.pages.has("export-log") && (
            <button className={props.activePage === "export-log" ? "active child" : "child"} onClick={() => props.onActivePage("export-log")}>
              <span>Log Format</span>
              <small>Custom download format</small>
            </button>
          )}
        </div>
      )}
      {props.matches.avro && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("avro")} aria-expanded={!props.collapsedGroups.avro}>
            {props.collapsedGroups.avro && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Avro
          </button>
          {(!props.collapsedGroups.avro || props.normalizedQuery) && props.matches.pages.has("avro-schemas") && (
            <button className={props.activePage === "avro-schemas" ? "active child" : "child"} onClick={() => props.onActivePage("avro-schemas")}>
              <span>Schemas</span>
              <small>{props.manualAvroSchemaRows.length} registered</small>
            </button>
          )}
        </div>
      )}
      {!props.matches.editor && !props.matches.export && !props.matches.avro && (
        <div className="preferences-no-results">No settings found</div>
      )}
    </aside>
  );
}
