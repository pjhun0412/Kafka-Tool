import { ChevronDown, ChevronRight, Filter, Pencil, Trash2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ManualAvroSchemaRow } from "../../hooks/useManualAvroSchemaSummary";
import type { PreferenceGroup, PreferencePage, PreferenceSearchMatches } from "../../hooks/usePreferenceNavigation";
import { fontOptions } from "../../uiTypes";

type PreferencesDialogProps = {
  activePage: PreferencePage;
  collapsedGroups: Record<PreferenceGroup, boolean>;
  query: string;
  normalizedQuery: string;
  matches: PreferenceSearchMatches;
  fontFamily: string;
  fontSize: number;
  exportFormatTemplate: string;
  manualAvroSchemaRows: ManualAvroSchemaRow[];
  onActivePage: (page: PreferencePage) => void;
  onToggleGroup: (group: PreferenceGroup) => void;
  onQuery: (query: string) => void;
  onFontFamily: (fontFamily: string) => void;
  onFontSize: (fontSize: number) => void;
  onExportFormatTemplate: Dispatch<SetStateAction<string>>;
  onOpenManualAvroSchema: (serverId: string, topic: string) => void;
  onDeleteManualAvroSchema: (serverId: string, topic: string) => void;
  onClose: () => void;
};

export function PreferencesDialog({
  activePage,
  collapsedGroups,
  query,
  normalizedQuery,
  matches,
  fontFamily,
  fontSize,
  exportFormatTemplate,
  manualAvroSchemaRows,
  onActivePage,
  onToggleGroup,
  onQuery,
  onFontFamily,
  onFontSize,
  onExportFormatTemplate,
  onOpenManualAvroSchema,
  onDeleteManualAvroSchema,
  onClose
}: PreferencesDialogProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="server-modal preferences-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-title">
          <div>
            <span className="eyebrow">Application</span>
            <h2 id="preferences-title">Preferences</h2>
          </div>
          <button className="modal-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <section className="preferences-layout">
          <aside className="preferences-nav" aria-label="Preference sections">
            <div className="preferences-search">
              <Filter size={14} />
              <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Search settings" />
              {query && (
                <button onClick={() => onQuery("")} title="Clear settings search">
                  <X size={13} />
                </button>
              )}
            </div>
            {matches.editor && (
              <div className="preferences-nav-group">
                <button className="preferences-nav-parent" type="button" onClick={() => onToggleGroup("editor")} aria-expanded={!collapsedGroups.editor}>
                  {collapsedGroups.editor && !normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Editor
                </button>
                {(!collapsedGroups.editor || normalizedQuery) && matches.pages.has("editor-font") && (
                  <button className={activePage === "editor-font" ? "active child" : "child"} onClick={() => onActivePage("editor-font")}>
                    <span>Font</span>
                    <small>Family and size</small>
                  </button>
                )}
              </div>
            )}
            {matches.export && (
              <div className="preferences-nav-group">
                <button className="preferences-nav-parent" type="button" onClick={() => onToggleGroup("export")} aria-expanded={!collapsedGroups.export}>
                  {collapsedGroups.export && !normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Export
                </button>
                {(!collapsedGroups.export || normalizedQuery) && matches.pages.has("export-log") && (
                  <button className={activePage === "export-log" ? "active child" : "child"} onClick={() => onActivePage("export-log")}>
                    <span>Log Format</span>
                    <small>Custom download format</small>
                  </button>
                )}
              </div>
            )}
            {matches.avro && (
              <div className="preferences-nav-group">
                <button className="preferences-nav-parent" type="button" onClick={() => onToggleGroup("avro")} aria-expanded={!collapsedGroups.avro}>
                  {collapsedGroups.avro && !normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Avro
                </button>
                {(!collapsedGroups.avro || normalizedQuery) && matches.pages.has("avro-schemas") && (
                  <button className={activePage === "avro-schemas" ? "active child" : "child"} onClick={() => onActivePage("avro-schemas")}>
                    <span>Schemas</span>
                    <small>{manualAvroSchemaRows.length} registered</small>
                  </button>
                )}
              </div>
            )}
            {!matches.editor && !matches.export && !matches.avro && (
              <div className="preferences-no-results">No settings found</div>
            )}
          </aside>
          <div className="preferences-content">
            {activePage === "editor-font" && (
              <section className="preferences-page">
                <header className="preferences-page-header">
                  <h3>Editor: Font</h3>
                  <p>Control the font used by the topic list, message grid, JSON viewer, and editors.</p>
                </header>
                <div className="setting-card">
                  <label>
                    Font Family
                    <span>Enter a CSS font-family list. The first installed font will be used.</span>
                    <input list="font-family-options" value={fontFamily} onChange={(event) => onFontFamily(event.target.value)} placeholder="D2Coding, Consolas, 'Courier New', monospace" />
                    <datalist id="font-family-options">
                      {fontOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </datalist>
                  </label>
                </div>
                <div className="setting-card">
                  <label>
                    Font Size
                    <span>Controls the base font size in pixels.</span>
                    <input type="number" min={11} max={16} value={fontSize} onChange={(event) => onFontSize(Number(event.target.value) || 13)} />
                  </label>
                  <label className="font-size-slider">
                    Size preview
                    <input type="range" min={11} max={16} value={fontSize} onChange={(event) => onFontSize(Number(event.target.value))} />
                  </label>
                </div>
                <div className="font-preview">
                  <strong>proc-status-t</strong>
                  <span>{"{\"system_time\":1780388670010,\"proc_id\":\"PR1001\"}"}</span>
                </div>
              </section>
            )}
            {activePage === "export-log" && (
              <section className="preferences-page">
                <header className="preferences-page-header">
                  <h3>Export: Log Format</h3>
                  <p>Customize the downloadable LOG format used by message exports.</p>
                </header>
                <div className="setting-card">
                  <label>
                    User Format: Log Export
                    <span>Use placeholders to build one line per Kafka message.</span>
                    <textarea
                      className="format-template-editor"
                      value={exportFormatTemplate}
                      onChange={(event) => onExportFormatTemplate(event.target.value)}
                      placeholder="[{timestamp}] {topic}[{partition}]@{offset} key={key} value={value}"
                    />
                  </label>
                </div>
                <div className="format-help">
                  Placeholders: {"{timestamp}"}, {"{topic}"}, {"{partition}"}, {"{offset}"}, {"{key}"}, {"{headers}"}, {"{value}"}
                </div>
              </section>
            )}
            {activePage === "avro-schemas" && (
              <section className="avro-schema-manager">
                <div className="manager-header">
                  <div>
                    <strong>Registered Avro Schemas</strong>
                    <span>Manage topic-level schemas used for Consume decoding and Produce serialization.</span>
                  </div>
                </div>
                {manualAvroSchemaRows.length === 0 ? (
                  <div className="manager-empty">No Avro schemas registered. Use a topic context menu or the Schema button on an opened topic.</div>
                ) : (
                  <div className="schema-manager-list">
                    {manualAvroSchemaRows.map((row) => (
                      <div className="schema-manager-row" key={`${row.serverId}:${row.topic}`}>
                        <div className="schema-manager-main">
                          <strong title={row.topic}>{row.topic}</strong>
                          <span title={row.serverName}>{row.serverName}</span>
                        </div>
                        <span className="schema-manager-pill">{row.schema.encoding === "confluent" ? `Confluent #${row.schema.schemaId ?? "-"}` : "Raw"}</span>
                        <span className="schema-manager-date">{new Date(row.schema.updatedAt).toLocaleString()}</span>
                        <div className="schema-manager-actions">
                          <button className="ghost compact" onClick={() => onOpenManualAvroSchema(row.serverId, row.topic)}>
                            <Pencil size={14} /> Edit
                          </button>
                          <button className="ghost compact danger-inline" onClick={() => onDeleteManualAvroSchema(row.serverId, row.topic)}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        </section>
        <div className="modal-actions">
          {activePage === "editor-font" && (
            <button className="ghost" onClick={() => {
              onFontFamily("D2Coding, Consolas, 'Courier New', monospace");
              onFontSize(13);
              onExportFormatTemplate("[{timestamp}] {topic}[{partition}]@{offset} key={key} headers={headers} value={value}");
            }}>
              Reset
            </button>
          )}
          <button className="primary" onClick={onClose}>Done</button>
        </div>
      </section>
    </div>
  );
}
