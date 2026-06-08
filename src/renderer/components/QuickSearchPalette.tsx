import React, { useEffect, useRef } from "react";
import { HelpCircle, Search, X } from "lucide-react";
import type { QuickSearchResult, QuickSearchScopedQuery } from "../quickSearch";

type QuickSearchPaletteProps = {
  open: boolean;
  query: string;
  results: QuickSearchResult[];
  selectedIndex: number;
  connectedServerIds: string[];
  scope: QuickSearchScopedQuery;
  onQuery: (query: string) => void;
  onIndex: (index: number) => void;
  onClose: () => void;
  onExecute: (result: QuickSearchResult) => void;
};

function kindLabel(kind: QuickSearchResult["kind"]) {
  if (kind === "consumer") return "consumer";
  if (kind === "command") return "command";
  return kind;
}

export function QuickSearchPalette(props: QuickSearchPaletteProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedResultRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (props.open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    selectedResultRef.current?.scrollIntoView({ block: "nearest" });
  }, [props.open, props.selectedIndex, props.results.length]);

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
                props.onIndex(Math.min(props.results.length - 1, props.selectedIndex + 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                props.onIndex(Math.max(0, props.selectedIndex - 1));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                const result = props.results[props.selectedIndex];
                if (result) props.onExecute(result);
              }
            }}
            placeholder='Search topics, consumers, commands, or scope with @"Server Name" topic'
          />
          {props.query && (
            <button onClick={() => props.onQuery("")} title="Clear search">
              <X size={15} />
            </button>
          )}
          <span className="quick-search-help-trigger">
            <button type="button" title="Quick search help" aria-label="Quick search help">
              <HelpCircle size={15} />
            </button>
            <span className="quick-search-help-popover" role="tooltip">
              <strong>Quick Search</strong>
              <span><b>Ctrl+P</b> or <b>Ctrl+K</b>: open search</span>
              <span><b>topic name</b>: find topics, tabs, consumers, servers</span>
              <span><b>@&quot;Server Name&quot; topic</b>: search inside one server</span>
              <span><b>&gt;topic delete topic-name</b>: delete topic after confirmation</span>
              <span><b>&gt;topic purge topic-name</b>: purge topic after confirmation</span>
            </span>
          </span>
        </div>
        {props.scope.serverToken && !props.scope.serverId && (
          <div className="quick-search-warning">No server matched @{props.scope.serverToken}. Use quotes for names with spaces.</div>
        )}
        {props.scope.serverSuggestions.length > 0 && props.query.trim().startsWith("@") && (
          <div className="quick-search-suggestions">
            {props.scope.serverSuggestions.map((server) => (
              <button key={server.id} onClick={() => props.onQuery(`@"${server.name}" `)}>
                @{server.name}
              </button>
            ))}
          </div>
        )}
        <div className="quick-search-results">
          {props.results.length === 0 ? (
            <div className="quick-search-empty">No results</div>
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
                <span className="quick-search-kind">{kindLabel(result.kind)}</span>
                <span className="quick-search-copy">
                  <strong>{result.title}</strong>
                  <small>{result.subtitle}</small>
                </span>
                {disconnected && <span className="quick-search-badge">Disconnected</span>}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
