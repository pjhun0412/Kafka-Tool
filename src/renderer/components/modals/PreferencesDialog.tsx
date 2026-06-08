import { X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ManualAvroSchemaRow } from "../../hooks/preferences/useManualAvroSchemaSummary";
import type { PreferenceGroup, PreferencePage, PreferenceSearchMatches } from "../../hooks/preferences/usePreferenceNavigation";
import { AvroSchemasPreferences } from "./preferences/AvroSchemasPreferences";
import { EditorFontPreferences } from "./preferences/EditorFontPreferences";
import { ExportLogPreferences } from "./preferences/ExportLogPreferences";
import { PreferencesNav } from "./preferences/PreferencesNav";

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
          <PreferencesNav
            activePage={activePage}
            collapsedGroups={collapsedGroups}
            query={query}
            normalizedQuery={normalizedQuery}
            matches={matches}
            manualAvroSchemaRows={manualAvroSchemaRows}
            onActivePage={onActivePage}
            onToggleGroup={onToggleGroup}
            onQuery={onQuery}
          />
          <div className="preferences-content">
            {activePage === "editor-font" && (
              <EditorFontPreferences
                fontFamily={fontFamily}
                fontSize={fontSize}
                onFontFamily={onFontFamily}
                onFontSize={onFontSize}
              />
            )}
            {activePage === "export-log" && (
              <ExportLogPreferences
                exportFormatTemplate={exportFormatTemplate}
                onExportFormatTemplate={onExportFormatTemplate}
              />
            )}
            {activePage === "avro-schemas" && (
              <AvroSchemasPreferences
                manualAvroSchemaRows={manualAvroSchemaRows}
                onOpenManualAvroSchema={onOpenManualAvroSchema}
                onDeleteManualAvroSchema={onDeleteManualAvroSchema}
              />
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
