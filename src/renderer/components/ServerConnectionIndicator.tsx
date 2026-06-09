import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { useAppLanguage } from "../hooks/state/useAppLanguage";
import { t } from "../i18n";

type ServerConnectionIndicatorProps = {
  serverId: string;
  connectedServerIds: string[];
  failedServerIds: string[];
  variant?: "icon" | "dot";
};

export function ServerConnectionIndicator({
  serverId,
  connectedServerIds,
  failedServerIds,
  variant = "icon"
}: ServerConnectionIndicatorProps) {
  const language = useAppLanguage();
  const isConnected = connectedServerIds.includes(serverId);
  const isFailed = failedServerIds.includes(serverId);
  const title = isFailed
    ? t(language, "title.connectionFailed")
    : isConnected
      ? t(language, "title.connected")
      : t(language, "title.disconnected");
  const className = [
    "connection-dot",
    isConnected ? "connected" : "",
    isFailed ? "failed" : "",
    variant === "dot" ? "compact" : ""
  ].filter(Boolean).join(" ");

  if (variant === "dot") {
    return <span className={className} title={title} />;
  }

  if (isFailed) {
    return (
      <span className={className} title={title}>
        <XCircle size={14} strokeWidth={2.6} />
      </span>
    );
  }

  if (isConnected) {
    return (
      <span className={className} title={title}>
        <CheckCircle2 size={14} strokeWidth={2.6} />
      </span>
    );
  }

  return (
    <span className={className} title={title}>
      <Circle size={14} strokeWidth={2.6} />
    </span>
  );
}
