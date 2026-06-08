import { useEffect } from "react";

export function useDismissOnWindowInteraction(active: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return;
    window.addEventListener("click", onDismiss);
    window.addEventListener("keydown", onDismiss);
    return () => {
      window.removeEventListener("click", onDismiss);
      window.removeEventListener("keydown", onDismiss);
    };
  }, [active, onDismiss]);
}
