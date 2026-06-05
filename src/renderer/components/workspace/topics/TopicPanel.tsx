import React from "react";
import type { TopicDetail } from "../../../../shared/types";

export function TopicPanel({ detail }: { detail: TopicDetail | null }) {
  if (!detail) return <section className="panel empty">토픽을 선택하세요.</section>;
  return (
    <section className="panel">
      <div className="section-title">
        <h2>{detail.name}</h2>
        <span>{detail.partitions.length} partitions</span>
      </div>
      <table>
        <thead>
          <tr><th>Partition</th><th>Leader</th><th>Replicas</th><th>ISR</th><th>Low</th><th>High</th></tr>
        </thead>
        <tbody>
          {detail.partitions.map((partition) => {
            const offset = detail.offsets.find((item) => item.partition === partition.partition);
            return (
              <tr key={partition.partition}>
                <td>{partition.partition}</td>
                <td>{partition.leader}</td>
                <td>{partition.replicas.join(", ")}</td>
                <td>{partition.isr.join(", ")}</td>
                <td>{offset?.low ?? "-"}</td>
                <td>{offset?.high ?? "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
