import { ChevronDown, ChevronUp, Square, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppLanguage } from "../../hooks/state/useAppLanguage";
import { t } from "../../i18n";
import { abortReplayJob, clearCompletedReplayJobs, useReplayJobs, type ReplayJob, type ReplayJobStatus } from "../../replayJobs";

function getReplayJobStatusKey(status: ReplayJobStatus) {
  if (status === "running") return "replay.jobRunning";
  if (status === "aborting") return "replay.jobAborting";
  if (status === "aborted") return "replay.jobAborted";
  if (status === "failed") return "replay.jobFailed";
  return "replay.jobCompleted";
}

function getReplayJobProgress(job: ReplayJob) {
  return Math.min(job.total, job.sent + job.failed);
}

export function ReplayJobsPanel() {
  const language = useAppLanguage();
  const jobs = useReplayJobs();
  const [collapsed, setCollapsed] = useState(false);
  const activeCount = useMemo(() => jobs.filter((job) => job.status === "running" || job.status === "aborting").length, [jobs]);
  const hasCompleted = jobs.some((job) => job.status === "completed" || job.status === "failed" || job.status === "aborted");

  if (jobs.length === 0) return null;

  return (
    <aside className={`replay-jobs-panel${collapsed ? " collapsed" : ""}`} aria-label={t(language, "replay.jobsTitle")}>
      <div className="replay-jobs-header">
        <div>
          <strong>{t(language, "replay.jobsTitle")}</strong>
          <span>{t(language, "replay.jobsSummary", { active: String(activeCount), total: String(jobs.length) })}</span>
        </div>
        <div className="replay-jobs-actions">
          {hasCompleted && (
            <button type="button" className="ghost icon-only" onClick={clearCompletedReplayJobs} title={t(language, "replay.clearCompletedJobs")}>
              <Trash2 size={14} />
            </button>
          )}
          <button type="button" className="ghost icon-only" onClick={() => setCollapsed((current) => !current)} title={collapsed ? t(language, "action.expand") : t(language, "action.collapse")}>
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="replay-jobs-list">
          {jobs.map((job) => {
            const progress = getReplayJobProgress(job);
            const isActive = job.status === "running" || job.status === "aborting";
            return (
              <article className={`replay-job-card ${job.status}`} key={job.id}>
                <div className="replay-job-topline">
                  <strong title={`${job.sourceTopic} -> ${job.targetTopic}`}>{`${job.sourceTopic} -> ${job.targetTopic}`}</strong>
                  <span>{t(language, getReplayJobStatusKey(job.status))}</span>
                </div>
                <div className="replay-job-meta">
                  <span title={`${job.sourceServerName} -> ${job.targetServerName}`}>{`${job.sourceServerName} -> ${job.targetServerName}`}</span>
                  <span>{progress}/{job.total}</span>
                  {job.delayMs > 0 && <span>{job.delayMs} ms</span>}
                </div>
                <progress value={progress} max={Math.max(1, job.total)} />
                {job.failures.length > 0 && (
                  <div className="replay-job-failures" title={job.failures.join("\n")}>
                    {job.failures[0]}
                    {job.failures.length > 1 && ` +${job.failures.length - 1}`}
                  </div>
                )}
                {isActive && (
                  <button type="button" className="replay-job-abort" onClick={() => abortReplayJob(job.id)} disabled={job.status === "aborting"}>
                    <Square size={12} /> {job.status === "aborting" ? t(language, "replay.jobAborting") : t(language, "replay.abort")}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </aside>
  );
}
