import { useEffect } from "react";
import type { KafkaApi } from "../../../shared/types";

function formatReason(reason: unknown) {
  if (reason instanceof Error) {
    return { message: reason.message, stack: reason.stack };
  }
  if (typeof reason === "string") {
    return { message: reason };
  }
  try {
    return { message: JSON.stringify(reason) };
  } catch {
    return { message: String(reason) };
  }
}

export function useRendererErrorLogging(kafkaApi: KafkaApi | undefined) {
  useEffect(() => {
    if (!kafkaApi) return;

    function onError(event: ErrorEvent) {
      void kafkaApi?.logError({
        level: "error",
        source: "window.onerror",
        message: event.message,
        stack: event.error instanceof Error ? event.error.stack : undefined
      });
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = formatReason(event.reason);
      void kafkaApi?.logError({
        level: "error",
        source: "unhandledrejection",
        message: reason.message,
        stack: reason.stack
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [kafkaApi]);
}
