import type { ConsumeOffsetRequest } from "../../shared/types.js";

type PartitionOffsetBounds = {
  high: string;
  low: string;
};

export type OffsetWindow = ReturnType<typeof resolveOffsetWindow>;

export function resolveOffsetWindow(request: ConsumeOffsetRequest, limit: number, partitionOffset?: PartitionOffsetBounds) {
  let seekOffset = request.offset;
  let endExclusive: bigint | null = null;
  let expectedMessageCount = limit;

  if (!partitionOffset || !/^\d+$/.test(partitionOffset.high) || !/^\d+$/.test(partitionOffset.low)) {
    return { seekOffset, endExclusive, expectedMessageCount };
  }

  const high = BigInt(partitionOffset.high);
  const low = BigInt(partitionOffset.low);
  if (request.order === "desc") {
    const snapshotEnd = request.endOffsetExclusive && /^\d+$/.test(request.endOffsetExclusive)
      ? (BigInt(request.endOffsetExclusive) < high ? BigInt(request.endOffsetExclusive) : high)
      : high;
    const requestedEnd = /^\d+$/.test(request.offset) ? BigInt(request.offset) : 0n;
    endExclusive = requestedEnd > low ? (requestedEnd < snapshotEnd ? requestedEnd : snapshotEnd) : snapshotEnd;
  } else {
    endExclusive = request.endOffsetExclusive && /^\d+$/.test(request.endOffsetExclusive)
      ? (BigInt(request.endOffsetExclusive) < high ? BigInt(request.endOffsetExclusive) : high)
      : high;
  }

  if (request.order === "desc" && endExclusive !== null) {
    const start = endExclusive > BigInt(limit) ? endExclusive - BigInt(limit) : low;
    seekOffset = (start > low ? start : low).toString();
  } else if (/^\d+$/.test(seekOffset) && BigInt(seekOffset) < low) {
    seekOffset = low.toString();
  }

  const startOffset = /^\d+$/.test(seekOffset) ? BigInt(seekOffset) : low;
  const boundedStart = startOffset > low ? startOffset : low;
  const remaining = endExclusive > boundedStart ? endExclusive - boundedStart : 0n;
  expectedMessageCount = Number(remaining > BigInt(limit) ? BigInt(limit) : remaining);

  return { seekOffset, endExclusive, expectedMessageCount };
}
