import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import type { ManualAvroSchemaRow } from "../../../hooks/preferences/useManualAvroSchemaSummary";
import type { PreferenceGroup, PreferencePage, PreferenceSearchMatches } from "../../../hooks/preferences/usePreferenceNavigation";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";

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
  const language = useAppLanguage();
  return (
    <aside className="preferences-nav" aria-label="Preference sections">
      <div className="preferences-search">
        <Filter size={14} />
        <input value={props.query} onChange={(event) => props.onQuery(event.target.value)} placeholder={t(language, "placeholder.searchSettings")} />
        {props.query && (
          <button onClick={() => props.onQuery("")} title={t(language, "title.clearSettingsSearch")}>
            <X size={13} />
          </button>
        )}
      </div>
      {props.matches.application && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("application")} aria-expanded={!props.collapsedGroups.application}>
            {props.collapsedGroups.application && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {t(language, "preferences.nav.application")}
          </button>
          {(!props.collapsedGroups.application || props.normalizedQuery) && props.matches.pages.has("language") && (
            <button className={props.activePage === "language" ? "active child" : "child"} onClick={() => props.onActivePage("language")}>
              <span>{t(language, "label.language")}</span>
              <small>{t(language, "preferences.nav.languageHelp")}</small>
            </button>
          )}
          {(!props.collapsedGroups.application || props.normalizedQuery) && props.matches.pages.has("diagnostics") && (
            <button className={props.activePage === "diagnostics" ? "active child" : "child"} onClick={() => props.onActivePage("diagnostics")}>
              <span>Diagnostics</span>
              <small>{language === "ko" ? "로그 보관 및 오류 분석" : "Logs and troubleshooting"}</small>
            </button>
          )}
        </div>
      )}
      {props.matches.editor && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("editor")} aria-expanded={!props.collapsedGroups.editor}>
            {props.collapsedGroups.editor && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {t(language, "preferences.nav.editor")}
          </button>
          {(!props.collapsedGroups.editor || props.normalizedQuery) && props.matches.pages.has("editor-font") && (
            <button className={props.activePage === "editor-font" ? "active child" : "child"} onClick={() => props.onActivePage("editor-font")}>
              <span>{t(language, "preferences.nav.font")}</span>
              <small>{t(language, "preferences.nav.fontHelp")}</small>
            </button>
          )}
          {(!props.collapsedGroups.editor || props.normalizedQuery) && props.matches.pages.has("keyboard-shortcuts") && (
            <button className={props.activePage === "keyboard-shortcuts" ? "active child" : "child"} onClick={() => props.onActivePage("keyboard-shortcuts")}>
              <span>{t(language, "preferences.nav.shortcuts")}</span>
              <small>{t(language, "preferences.nav.shortcutsHelp")}</small>
            </button>
          )}
        </div>
      )}
      {props.matches.consume && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("consume")} aria-expanded={!props.collapsedGroups.consume}>
            {props.collapsedGroups.consume && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} Consume
          </button>
          {(!props.collapsedGroups.consume || props.normalizedQuery) && props.matches.pages.has("viewer-defaults") && (
            <button className={props.activePage === "viewer-defaults" ? "active child" : "child"} onClick={() => props.onActivePage("viewer-defaults")}>
              <span>{t(language, "preferences.nav.viewerDefaults")}</span>
              <small>{t(language, "preferences.nav.viewerDefaultsHelp")}</small>
            </button>
          )}
        </div>
      )}
      {props.matches.export && (
        <div className="preferences-nav-group">
          <button className="preferences-nav-parent" type="button" onClick={() => props.onToggleGroup("export")} aria-expanded={!props.collapsedGroups.export}>
            {props.collapsedGroups.export && !props.normalizedQuery ? <ChevronRight size={14} /> : <ChevronDown size={14} />} {t(language, "preferences.nav.export")}
          </button>
          {(!props.collapsedGroups.export || props.normalizedQuery) && props.matches.pages.has("export-log") && (
            <button className={props.activePage === "export-log" ? "active child" : "child"} onClick={() => props.onActivePage("export-log")}>
              <span>{t(language, "preferences.nav.logFormat")}</span>
              <small>{t(language, "preferences.nav.logFormatHelp")}</small>
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
              <span>{t(language, "preferences.nav.schemas")}</span>
              <small>{t(language, "preferences.nav.registered", { count: String(props.manualAvroSchemaRows.length) })}</small>
            </button>
          )}
        </div>
      )}
      {!props.matches.application && !props.matches.editor && !props.matches.consume && !props.matches.export && !props.matches.avro && (
        <div className="preferences-no-results">{t(language, "preferences.nav.noResults")}</div>
      )}
    </aside>
  );
}
