import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import type { AppLanguage } from "../../../i18n";
import { translateMessage } from "../../../i18n";
import type { PaneToastState } from "../../../uiTypes";

export function PaneToastView({ toast, language }: { toast: NonNullable<PaneToastState>; language: AppLanguage }) {
  const Icon = toast.kind === "loading" ? RefreshCw : toast.kind === "success" ? CheckCircle2 : XCircle;
  return (
    <div className={`pane-local-toast ${toast.kind}`}>
      <Icon size={14} className={toast.kind === "loading" ? "spin" : ""} />
      <span>{translateMessage(language, toast.message)}</span>
    </div>
  );
}
