import React from "react";
import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import type { PaneToastState } from "../../../uiTypes";

export function PaneToastView({ toast }: { toast: NonNullable<PaneToastState> }) {
  const Icon = toast.kind === "loading" ? RefreshCw : toast.kind === "success" ? CheckCircle2 : XCircle;
  return (
    <div className={`pane-local-toast ${toast.kind}`}>
      <Icon size={14} className={toast.kind === "loading" ? "spin" : ""} />
      <span>{toast.message}</span>
    </div>
  );
}
