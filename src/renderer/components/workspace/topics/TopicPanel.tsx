import type { TopicDetail } from "../../../../shared/types";
import { useAppLanguage } from "../../../hooks/state/useAppLanguage";
import { t } from "../../../i18n";
import { formatCount } from "../../../utils";

function bigintFromText(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  return BigInt(value);
}

function formatBigint(value: bigint) {
  return value > BigInt(Number.MAX_SAFE_INTEGER) ? value.toString() : formatCount(value.toString());
}

function getConfigValue(detail: TopicDetail, name: string) {
  return detail.configs?.find((config) => config.name === name)?.value || "-";
}

export function TopicPanel({ detail, onClearMessages }: { detail: TopicDetail | null; onClearMessages: () => void }) {
  const language = useAppLanguage();
  if (!detail) return <section className="panel empty">{t(language, "topic.select")}</section>;
  const offsetsByPartition = new Map(detail.offsets.map((offset) => [offset.partition, offset]));
  const messageTotal = detail.offsets.reduce((total, offset) => {
    const low = bigintFromText(offset.low);
    const high = bigintFromText(offset.high);
    if (low === null || high === null || high < low) return total;
    return total + (high - low);
  }, 0n);
  const replicaCount = detail.partitions.reduce((total, partition) => total + partition.replicas.length, 0);
  const inSyncReplicaCount = detail.partitions.reduce((total, partition) => total + partition.isr.length, 0);
  const underReplicatedCount = detail.partitions.filter((partition) => partition.isr.length < partition.replicas.length).length;
  const leaders = Array.from(new Set(detail.partitions.map((partition) => partition.leader).filter((leader) => leader >= 0))).sort((left, right) => left - right);
  const replicationFactor = detail.partitions[0]?.replicas.length ?? 0;
  return (
    <section className="panel">
      <div className="section-title">
        <h2>{detail.name}</h2>
        <div className="section-title-actions">
          <span>{detail.partitions.length} {t(language, "label.partitions")}</span>
          <button className="danger compact" type="button" onClick={onClearMessages}>
            {t(language, "action.clearMessages")}
          </button>
        </div>
      </div>
      <div className="topic-info-summary">
        <div><span>{t(language, "label.messages")}</span><strong>{formatBigint(messageTotal)}</strong></div>
        <div><span>{t(language, "label.replicationFactor")}</span><strong>{replicationFactor || "-"}</strong></div>
        <div><span>{t(language, "label.replicas")}</span><strong>{replicaCount}</strong></div>
        <div><span>ISR</span><strong>{inSyncReplicaCount}</strong></div>
        <div><span>{t(language, "label.underReplicated")}</span><strong className={underReplicatedCount > 0 ? "metric-warn" : ""}>{underReplicatedCount}</strong></div>
        <div><span>{t(language, "label.leaders")}</span><strong>{leaders.length ? leaders.join(", ") : "-"}</strong></div>
      </div>
      <div className="topic-info-configs">
        <div><span>{t(language, "label.cleanupPolicy")}</span><strong>{getConfigValue(detail, "cleanup.policy")}</strong></div>
        <div><span>{t(language, "label.minInSyncReplicas")}</span><strong>{getConfigValue(detail, "min.insync.replicas")}</strong></div>
        <div><span>{t(language, "label.retentionMs")}</span><strong>{getConfigValue(detail, "retention.ms")}</strong></div>
        <div><span>{t(language, "label.retentionBytesGb")}</span><strong>{getConfigValue(detail, "retention.bytes")}</strong></div>
        <div><span>{t(language, "label.maxMessageBytes")}</span><strong>{getConfigValue(detail, "max.message.bytes")}</strong></div>
        <div><span>message.timestamp.type</span><strong>{getConfigValue(detail, "message.timestamp.type")}</strong></div>
      </div>
      <table className="topic-info-partitions">
        <thead>
          <tr><th>Partition</th><th>Leader</th><th>Replicas</th><th>ISR</th><th>Low</th><th>High</th><th>{t(language, "label.messages")}</th></tr>
        </thead>
        <tbody>
          {detail.partitions.map((partition) => {
            const offset = offsetsByPartition.get(partition.partition);
            const low = bigintFromText(offset?.low);
            const high = bigintFromText(offset?.high);
            const count = low === null || high === null || high < low ? "-" : formatBigint(high - low);
            return (
              <tr key={partition.partition}>
                <td>{partition.partition}</td>
                <td>{partition.leader}</td>
                <td>{partition.replicas.join(", ")}</td>
                <td>{partition.isr.join(", ")}</td>
                <td>{offset?.low ?? "-"}</td>
                <td>{offset?.high ?? "-"}</td>
                <td>{count}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
