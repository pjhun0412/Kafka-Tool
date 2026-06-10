export function configSourceLabel(source: number | string) {
  const labels: Record<number, string> = {
    0: "unknown",
    1: "topic",
    2: "dynamic broker",
    3: "dynamic default broker",
    4: "static broker",
    5: "default",
    6: "dynamic broker logger"
  };
  return typeof source === "number" ? labels[source] ?? String(source) : source;
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  });
  await Promise.all(workers);
  return results;
}

export function calculateLag(currentOffset: string, endOffset: string) {
  if (currentOffset === "-1" || !/^\d+$/.test(currentOffset) || !/^\d+$/.test(endOffset)) {
    return "-";
  }
  const lag = BigInt(endOffset) - BigInt(currentOffset);
  return lag < 0n ? "0" : lag.toString();
}

export function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 80) || "messages";
}
