import { CheckCircle2, Circle, XCircle } from "lucide-react";

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
  const isConnected = connectedServerIds.includes(serverId);
  const isFailed = failedServerIds.includes(serverId);
  const className = [
    "connection-dot",
    isConnected ? "connected" : "",
    isFailed ? "failed" : "",
    variant === "dot" ? "compact" : ""
  ].filter(Boolean).join(" ");

  if (variant === "dot") {
    return <span className={className} title={isFailed ? "Connection failed" : isConnected ? "Connected" : "Disconnected"} />;
  }

  if (isFailed) {
    return (
      <span className={className} title="Connection failed">
        <XCircle size={14} strokeWidth={2.6} />
      </span>
    );
  }

  if (isConnected) {
    return (
      <span className={className} title="Connected">
        <CheckCircle2 size={14} strokeWidth={2.6} />
      </span>
    );
  }

  return (
    <span className={className} title="Disconnected">
      <Circle size={14} strokeWidth={2.6} />
    </span>
  );
}
