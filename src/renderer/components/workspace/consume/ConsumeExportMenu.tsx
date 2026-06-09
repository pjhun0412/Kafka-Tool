import { ChevronDown, Download } from "lucide-react";
import type { ConsumedMessage, MessageExportFormat } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { Button } from "../../ui";

export function ConsumeExportMenu(props: {
  filteredMessages: ConsumedMessage[];
  canExportFullOffsetRange: boolean;
  isExportMenuOpen: boolean;
  onExportMenuOpen: (open: boolean | ((current: boolean) => boolean)) => void;
  onExport: (format: MessageExportFormat, messages: ConsumedMessage[]) => void;
  onExportAll: (format: MessageExportFormat) => void;
}) {
  const language = useAppLanguage();
  return (
    <div className="export-menu">
      <Button
        variant="subtle"
        className="export-button"
        onClick={() => props.onExportMenuOpen((current) => !current)}
        disabled={props.filteredMessages.length === 0}
        title={t(language, "title.exportFilteredMessages")}
      >
        <Download size={14} />
        <ChevronDown size={13} />
      </Button>
      {props.isExportMenuOpen && (
        <div className="export-menu-popover">
          <span className="export-menu-label">{t(language, "label.currentPage")}</span>
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
              <span className="export-menu-label">{t(language, "label.fullOffsetRange")}</span>
              {(["json", "csv", "log"] as MessageExportFormat[]).map((format) => (
                <button
                  key={`all-${format}`}
                  onClick={() => {
                    props.onExportMenuOpen(false);
                    props.onExportAll(format);
                  }}
                >
                  <Download size={13} />
                  {t(language, "label.allFormat", { format: format.toUpperCase() })}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
