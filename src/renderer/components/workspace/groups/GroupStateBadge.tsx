export function GroupStateBadge({ state }: { state?: string }) {
  const normalized = (state || "unknown").toLowerCase();
  return <span className={`group-state-badge ${normalized}`}>{state || "UNKNOWN"}</span>;
}
