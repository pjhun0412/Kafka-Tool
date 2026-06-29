import { useSyncExternalStore } from "react";
import type { ReplayDraft } from "./replayTypes";

export type ReplayJobStatus = "running" | "aborting" | "aborted" | "completed" | "failed";

export type ReplayJob = {
  id: string;
  sourceServerId: string;
  sourceServerName: string;
  sourceTopic: string;
  targetServerId: string;
  targetServerName: string;
  targetTopic: string;
  total: number;
  sent: number;
  failed: number;
  delayMs: number;
  status: ReplayJobStatus;
  failures: string[];
  startedAt: number;
  completedAt?: number;
};

type ReplayJobController = ReplayJob & {
  abortRequested: boolean;
};

type StartReplayJobRequest = {
  sourceServerId: string;
  sourceServerName: string;
  sourceTopic: string;
  targetServerId: string;
  targetServerName: string;
  targetTopic: string;
  drafts: ReplayDraft[];
  messageLabels: string[];
  delayMs: number;
  stopOnFirstError: boolean;
  send: (serverId: string, topic: string, draft: ReplayDraft) => Promise<void>;
};

const replayJobs = new Map<string, ReplayJobController>();
const replayJobListeners = new Set<() => void>();
let replayJobSnapshot: ReplayJob[] = [];

function toReplayJob(job: ReplayJobController): ReplayJob {
  const { abortRequested: _abortRequested, ...snapshot } = job;
  return {
    ...snapshot,
    failures: [...snapshot.failures]
  };
}

function emitReplayJobs() {
  replayJobSnapshot = Array.from(replayJobs.values())
    .sort((left, right) => right.startedAt - left.startedAt)
    .map(toReplayJob);
  replayJobListeners.forEach((listener) => listener());
}

function updateReplayJob(id: string, patch: Partial<ReplayJobController>) {
  const current = replayJobs.get(id);
  if (!current) return;
  replayJobs.set(id, { ...current, ...patch });
  emitReplayJobs();
}

async function waitReplayJobDelay(ms: number, shouldAbort: () => boolean) {
  const safeMs = Math.max(0, Math.floor(ms));
  if (safeMs <= 0) return true;
  const startedAt = Date.now();
  while (Date.now() - startedAt < safeMs) {
    if (shouldAbort()) return false;
    await new Promise((resolve) => window.setTimeout(resolve, Math.min(50, safeMs - (Date.now() - startedAt))));
  }
  return !shouldAbort();
}

export function subscribeReplayJobs(listener: () => void) {
  replayJobListeners.add(listener);
  return () => {
    replayJobListeners.delete(listener);
  };
}

export function getReplayJobsSnapshot() {
  return replayJobSnapshot;
}

export function useReplayJobs() {
  return useSyncExternalStore(subscribeReplayJobs, getReplayJobsSnapshot, getReplayJobsSnapshot);
}

export function abortReplayJob(id: string) {
  const job = replayJobs.get(id);
  if (!job || (job.status !== "running" && job.status !== "aborting")) return;
  replayJobs.set(id, { ...job, abortRequested: true, status: "aborting" });
  emitReplayJobs();
}

export function clearCompletedReplayJobs() {
  let changed = false;
  for (const [id, job] of replayJobs.entries()) {
    if (job.status === "completed" || job.status === "failed" || job.status === "aborted") {
      replayJobs.delete(id);
      changed = true;
    }
  }
  if (changed) emitReplayJobs();
}

export function startReplayJob(request: StartReplayJobRequest) {
  const id = `replay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const job: ReplayJobController = {
    id,
    sourceServerId: request.sourceServerId,
    sourceServerName: request.sourceServerName,
    sourceTopic: request.sourceTopic,
    targetServerId: request.targetServerId,
    targetServerName: request.targetServerName,
    targetTopic: request.targetTopic,
    total: request.drafts.length,
    sent: 0,
    failed: 0,
    delayMs: request.delayMs,
    status: "running",
    failures: [],
    startedAt: Date.now(),
    abortRequested: false
  };
  replayJobs.set(id, job);
  emitReplayJobs();

  void (async () => {
    const failures: string[] = [];
    let aborted = false;
    for (let index = 0; index < request.drafts.length; index += 1) {
      const current = replayJobs.get(id);
      if (!current || current.abortRequested) {
        aborted = true;
        break;
      }
      const draft = request.drafts[index];
      if (!draft) continue;
      try {
        await request.send(request.targetServerId, request.targetTopic, draft);
        const latest = replayJobs.get(id);
        if (latest) updateReplayJob(id, { sent: latest.sent + 1 });
      } catch (error) {
        const label = request.messageLabels[index] ?? `${request.sourceTopic}#${index + 1}`;
        failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
        const latest = replayJobs.get(id);
        if (latest) {
          updateReplayJob(id, {
            failed: latest.failed + 1,
            failures: [...failures]
          });
        }
        if (request.stopOnFirstError) break;
      }
      if (index < request.drafts.length - 1 && request.delayMs > 0) {
        const shouldContinue = await waitReplayJobDelay(request.delayMs, () => Boolean(replayJobs.get(id)?.abortRequested));
        if (!shouldContinue) {
          aborted = true;
          break;
        }
      }
    }

    const latest = replayJobs.get(id);
    if (!latest) return;
    if (aborted) {
      updateReplayJob(id, { status: "aborted", completedAt: Date.now() });
      return;
    }
    updateReplayJob(id, {
      status: failures.length > 0 ? "failed" : "completed",
      completedAt: Date.now(),
      failures: [...failures]
    });
  })();

  return id;
}
