import React, { useEffect, useRef, useState } from "react";
import { HelpCircle, Search, X } from "lucide-react";
import { useAppLanguage } from "../hooks/state/useAppLanguage";
import { t } from "../i18n";
import type { QuickSearchResult, QuickSearchScopedQuery } from "../quickSearch";

type QuickSearchPaletteProps = {
  open: boolean;
  query: string;
  results: QuickSearchResult[];
  selectedIndex: number;
  connectedServerIds: string[];
  scope: QuickSearchScopedQuery;
  onQuery: (query: string) => void;
  onIndex: (index: number | ((current: number) => number)) => void;
  onClose: () => void;
  onExecute: (result: QuickSearchResult) => void;
};

function kindLabel(kind: QuickSearchResult["kind"]) {
  if (kind === "consumer") return "consumer";
  if (kind === "command") return "command";
  return kind;
}

export function QuickSearchPalette(props: QuickSearchPaletteProps) {
  const language = useAppLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedResultRef = useRef<HTMLButtonElement | null>(null);
  const selectedSuggestionRef = useRef<HTMLButtonElement | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const showServerSuggestions = props.scope.serverSuggestions.length > 0 && props.query.trim().startsWith("@");

  useEffect(() => {
    if (props.open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    selectedResultRef.current?.scrollIntoView({ block: "nearest" });
  }, [props.open, props.selectedIndex, props.results.length]);

  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [props.query, props.scope.serverSuggestions.length]);

  useEffect(() => {
    if (!props.open || !showServerSuggestions) return;
    selectedSuggestionRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [props.open, selectedSuggestionIndex, showServerSuggestions]);

  function applyServerSuggestion(index = selectedSuggestionIndex) {
    const server = props.scope.serverSuggestions[index];
    if (!server) return false;
    props.onQuery(`@"${server.name}" `);
    props.onIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    return true;
  }

  if (!props.open) return null;

  return (
    <div className="quick-search-backdrop" role="presentation" onMouseDown={props.onClose}>
      <section className="quick-search-palette" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <div className="quick-search-input">
          <Search size={17} />
          <input
            ref={inputRef}
            value={props.query}
            onChange={(event) => {
              props.onQuery(event.target.value);
              props.onIndex(0);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.preventDefault();
                props.onClose();
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                if (showServerSuggestions) {
                  setSelectedSuggestionIndex((current) => Math.min(props.scope.serverSuggestions.length - 1, current + 1));
                  return;
                }
                props.onIndex((current) => Math.min(Math.max(0, props.results.length - 1), current + 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                if (showServerSuggestions) {
                  setSelectedSuggestionIndex((current) => Math.max(0, current - 1));
                  return;
                }
                props.onIndex((current) => Math.max(0, current - 1));
              }
              if (event.key === "Tab" && showServerSuggestions) {
                event.preventDefault();
                applyServerSuggestion();
              }
              if (event.key === "Enter") {
                event.preventDefault();
                if (showServerSuggestions && applyServerSuggestion()) return;
                const result = props.results[props.selectedIndex];
                if (result) props.onExecute(result);
              }
            }}
            placeholder={t(language, "placeholder.searchQuick")}
          />
          {props.query && (
            <button onClick={() => props.onQuery("")} title={t(language, "title.clearSearch")}>
              <X size={15} />
            </button>
          )}
          <span className="quick-search-help-trigger">
            <button type="button" title={t(language, "title.quickSearchHelp")} aria-label={t(language, "title.quickSearchHelp")}>
              <HelpCircle size={15} />
            </button>
            <span className="quick-search-help-popover" role="tooltip">
              <strong>{t(language, "quickSearch.title")}</strong>
              <span>{t(language, "quickSearch.openHelp")}</span>
              <span>{t(language, "quickSearch.topicHelp")}</span>
              <span>{t(language, "quickSearch.scopeHelp")}</span>
              <span>{t(language, "quickSearch.deleteHelp")}</span>
              <span>{t(language, "quickSearch.purgeHelp")}</span>
            </span>
          </span>
        </div>
        {props.scope.serverToken && !props.scope.serverId && (
          <div className="quick-search-warning">{t(language, "quickSearch.noServerMatched", { server: props.scope.serverToken })}</div>
        )}
        {showServerSuggestions && (
          <div className="quick-search-suggestions">
            {props.scope.serverSuggestions.map((server, index) => (
              (() => {
                const connected = props.connectedServerIds.includes(server.id);
                return (
                  <button
                    key={server.id}
                    ref={index === selectedSuggestionIndex ? selectedSuggestionRef : undefined}
                    className={`${index === selectedSuggestionIndex ? "active" : ""} ${connected ? "connected" : "disconnected"}`}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    onClick={() => applyServerSuggestion(index)}
                  >
                    <span className="quick-search-server-state" aria-hidden="true" />
                    <strong>@{server.name}</strong>
                    <small>{connected ? t(language, "title.connected") : t(language, "label.disconnected")}</small>
                  </button>
                );
              })()
            ))}
          </div>
        )}
        <div className="quick-search-results">
          {props.results.length === 0 ? (
            <div className="quick-search-empty">{t(language, "label.noResults")}</div>
          ) : props.results.map((result, index) => {
            const disconnected = Boolean(result.serverId && !props.connectedServerIds.includes(result.serverId));
            return (
              <button
                key={result.id}
                ref={index === props.selectedIndex ? selectedResultRef : undefined}
                className={`${index === props.selectedIndex ? "active" : ""} ${disconnected ? "disconnected" : ""}`}
                onMouseEnter={() => props.onIndex(index)}
                onClick={() => props.onExecute(result)}
              >
                <span className={`quick-search-kind kind-${result.kind}`}>{kindLabel(result.kind)}</span>
                <span className="quick-search-copy">
                  <strong>{result.title}</strong>
                  <small>{result.subtitle}</small>
                </span>
                {disconnected && <span className="quick-search-badge">{t(language, "label.disconnected")}</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
