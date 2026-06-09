import type React from "react";

export function useInspectorResize(params: {
  consumeGridRef: React.RefObject<HTMLDivElement | null>;
  inspectorCollapsed: boolean;
  messagePaneHeight: number;
  onMessagePaneHeight: (value: number) => void;
}) {
  return function startInspectorResize(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const gridElement = params.consumeGridRef.current;
    if (!gridElement) return;
    const resizeHandle = event.currentTarget;
    resizeHandle.setPointerCapture(event.pointerId);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    const startY = event.clientY;
    const startHeight = params.messagePaneHeight;
    const gridHeight = gridElement.getBoundingClientRect().height;
    let nextHeight = startHeight;
    let animationFrame = 0;
    const applyHeight = () => {
      gridElement.style.gridTemplateRows = `${nextHeight}px 8px minmax(0, 1fr)`;
      animationFrame = 0;
    };
    const onPointerMove = (moveEvent: PointerEvent) => {
      const maxHeight = Math.max(150, gridHeight - 250);
      nextHeight = Math.min(maxHeight, Math.max(120, startHeight + moveEvent.clientY - startY));
      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(applyHeight);
      }
    };
    const cleanup = (pointerId: number) => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (resizeHandle.hasPointerCapture(pointerId)) {
        resizeHandle.releasePointerCapture(pointerId);
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
    };
    const onPointerUp = (upEvent: PointerEvent) => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        applyHeight();
      }
      params.onMessagePaneHeight(nextHeight);
      cleanup(upEvent.pointerId);
    };
    const onPointerCancel = (cancelEvent: PointerEvent) => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      gridElement.style.gridTemplateRows = params.inspectorCollapsed
        ? "minmax(0, 1fr) 34px"
        : `${params.messagePaneHeight}px 8px minmax(0, 1fr)`;
      cleanup(cancelEvent.pointerId);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
  };
}
