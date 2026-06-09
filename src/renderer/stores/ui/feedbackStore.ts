import { create } from "zustand";
import type { PaneToastState, ToastState } from "../../uiTypes";

type ConnectionErrorState = { serverName: string; brokers: string; message: string } | null;
type SetValue<T> = T | ((current: T) => T);

type FeedbackStore = {
  status: string;
  toast: ToastState;
  paneToast: PaneToastState;
  loading: boolean;
  activeConsumeTaskKeys: string[];
  connectionError: ConnectionErrorState;
  setStatus: (status: SetValue<string>) => void;
  setToast: (toast: SetValue<ToastState>) => void;
  setPaneToast: (toast: SetValue<PaneToastState>) => void;
  setLoading: (loading: SetValue<boolean>) => void;
  setActiveConsumeTaskKeys: (keys: SetValue<string[]>) => void;
  setConnectionError: (error: SetValue<ConnectionErrorState>) => void;
};

function resolveValue<T>(value: SetValue<T>, current: T) {
  return typeof value === "function" ? (value as (current: T) => T)(current) : value;
}

export const useFeedbackStore = create<FeedbackStore>((set) => ({
  status: "Register or select a server.",
  toast: null,
  paneToast: null,
  loading: false,
  activeConsumeTaskKeys: [],
  connectionError: null,
  setStatus: (status) => set((current) => ({ status: resolveValue(status, current.status) })),
  setToast: (toast) => set((current) => ({ toast: resolveValue(toast, current.toast) })),
  setPaneToast: (paneToast) => set((current) => ({ paneToast: resolveValue(paneToast, current.paneToast) })),
  setLoading: (loading) => set((current) => ({ loading: resolveValue(loading, current.loading) })),
  setActiveConsumeTaskKeys: (activeConsumeTaskKeys) => set((current) => ({
    activeConsumeTaskKeys: resolveValue(activeConsumeTaskKeys, current.activeConsumeTaskKeys)
  })),
  setConnectionError: (connectionError) => set((current) => ({
    connectionError: resolveValue(connectionError, current.connectionError)
  }))
}));
