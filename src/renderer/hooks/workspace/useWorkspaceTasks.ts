import type { Dispatch, SetStateAction } from "react";
import type { PaneToastState, ToastState, WorkspaceActionTarget, WorkspacePaneId } from "../../uiTypes";
import { getConsumeTaskKey } from "../../workspaceState";

type PaneToastScope = {
  serverId?: string;
  topic?: string;
};

type WorkspaceTaskParams = {
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStatus: (status: string) => void;
  setToast: Dispatch<SetStateAction<ToastState>>;
  setPaneToast: Dispatch<SetStateAction<PaneToastState>>;
  setActiveConsumeTaskKeys: Dispatch<SetStateAction<string[]>>;
};

export function useWorkspaceTasks({
  setLoading,
  setStatus,
  setToast,
  setPaneToast,
  setActiveConsumeTaskKeys
}: WorkspaceTaskParams) {
  async function runTask<T>(label: string, task: () => Promise<T>, options: { toast?: boolean } = {}) {
    const showToast = options.toast !== false;
    setLoading(true);
    setStatus(label);
    if (showToast) {
      setToast({ message: label, kind: "loading" });
    }
    try {
      const result = await task();
      setStatus("완료");
      if (showToast) {
        setToast({ message: "완료", kind: "success" });
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      if (showToast) {
        setToast({ message, kind: "error" });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function runPaneTask<T>(pane: WorkspacePaneId, label: string, task: () => Promise<T>, scope: PaneToastScope = {}) {
    setLoading(true);
    setStatus(label);
    setToast(null);
    setPaneToast({ pane, message: label, kind: "loading", ...scope });
    try {
      const result = await task();
      setStatus("완료");
      setPaneToast({ pane, message: "완료", kind: "success", ...scope });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(message);
      setPaneToast({ pane, message, kind: "error", ...scope });
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function runWorkspaceTask<T>(target: WorkspaceActionTarget, label: string, task: () => Promise<T>) {
    const taskKey = target.topic ? getConsumeTaskKey(target.pane, target.serverId, target.topic) : null;
    if (taskKey) {
      setActiveConsumeTaskKeys((current) => current.includes(taskKey) ? current : [...current, taskKey]);
    }
    try {
      return await runPaneTask(target.pane, label, task, { serverId: target.serverId, topic: target.topic });
    } finally {
      if (taskKey) {
        setActiveConsumeTaskKeys((current) => current.filter((key) => key !== taskKey));
      }
    }
  }

  function showPaneToast(pane: WorkspacePaneId, message: string, kind: "success" | "error" = "success", scope: PaneToastScope = {}) {
    setStatus(message);
    setToast(null);
    setPaneToast({ pane, message, kind, ...scope });
  }

  return {
    runTask,
    runPaneTask,
    runWorkspaceTask,
    showPaneToast
  };
}
