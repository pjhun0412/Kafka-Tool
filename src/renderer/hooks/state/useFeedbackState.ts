import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFeedbackStore } from "../../stores/ui/feedbackStore";

export function useFeedbackState() {
  const {
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
  } = useFeedbackStore(useShallow((state) => ({
    status: state.status,
    setStatus: state.setStatus,
    toast: state.toast,
    setToast: state.setToast,
    paneToast: state.paneToast,
    setPaneToast: state.setPaneToast,
    loading: state.loading,
    setLoading: state.setLoading,
    activeConsumeTaskKeys: state.activeConsumeTaskKeys,
    setActiveConsumeTaskKeys: state.setActiveConsumeTaskKeys,
    connectionError: state.connectionError,
    setConnectionError: state.setConnectionError
  })));

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
