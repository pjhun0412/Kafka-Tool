import { ChevronDown, Download } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import { Button } from "../../ui";

export function ConsumeExportMenu(props: {
  filteredMessages: ConsumedMessage[];
  canExportFullOffsetRange: boolean;
  isExportMenuOpen: boolean;
  onExportMenuOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
}) {
  return (
    <div className="export-menu">
      <Button
        variant="subtle"
        className="export-button"
        onClick={() => props.onExportMenuOpen((current) => !current)}
        disabled={props.filteredMessages.length === 0}
        title="Export filtered messages"
      >
        <Download size={14} />
        <ChevronDown size={13} />
      </Button>
      {props.isExportMenuOpen && (
        <div className="export-menu-popover">
          <span className="export-menu-label">Current page</span>
          {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => {
                props.onExportMenuOpen(false);
                props.onExport(format, props.filteredMessages);
              }}
            >
              <Download size={13} />
              {format.toUpperCase()}
            </button>
          ))}
          {props.canExportFullOffsetRange && (
            <>
              <span className="export-menu-divider" />
              <span className="export-menu-label">Full offset range</span>
              {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
                <button
                  key={`all-${format}`}
                  onClick={() => {
                    props.onExportMenuOpen(false);
                    props.onExportAll(format);
                  }}
                >
                  <Download size={13} />
                  All {format.toUpperCase()}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
