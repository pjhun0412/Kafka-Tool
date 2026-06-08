import { useEffect } from "react";
import { useFeedbackStore } from "../stores/ui/feedbackStore";

export function useFeedbackState() {
  const status = useFeedbackStore((state) => state.status);
  const setStatus = useFeedbackStore((state) => state.setStatus);
  const toast = useFeedbackStore((state) => state.toast);
  const setToast = useFeedbackStore((state) => state.setToast);
  const paneToast = useFeedbackStore((state) => state.paneToast);
  const setPaneToast = useFeedbackStore((state) => state.setPaneToast);
  const loading = useFeedbackStore((state) => state.loading);
  const setLoading = useFeedbackStore((state) => state.setLoading);
  const activeConsumeTaskKeys = useFeedbackStore((state) => state.activeConsumeTaskKeys);
  const setActiveConsumeTaskKeys = useFeedbackStore((state) => state.setActiveConsumeTaskKeys);
  const connectionError = useFeedbackStore((state) => state.connectionError);
  const setConnectionError = useFeedbackStore((state) => state.setConnectionError);

  useEffect(() => {
    if (!toast || toast.kind === "loading") return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [setToast, toast]);

  useEffect(() => {
    if (!paneToast || paneToast.kind === "loading") return;
    const timer = window.setTimeout(() => setPaneToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [paneToast, setPaneToast]);

  return {
    status,
    setStatus,
    toast,
    setToast,
    paneToast,
    setPaneToast,
    loading,
    setLoading,
    activeConsumeTaskKeys,
    setActiveConsumeTaskKeys,
    connectionError,
    setConnectionError
  };
}
