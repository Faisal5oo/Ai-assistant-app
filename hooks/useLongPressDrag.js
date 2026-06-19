"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Long-press gesture wrapper for pointer-event drag initiation.
 *
 * Behaviour summary:
 *  - On pointerdown a 250 ms hold timer starts.
 *  - If the pointer travels >= MOVE_THRESHOLD_PX before the timer fires the
 *    hold is cancelled (prevents interference with normal scroll).
 *  - When the hold fires:
 *      1. `touch-action: none` is applied to <body> to block native scroll
 *         for the lifetime of the drag session.
 *      2. The drag is committed via onDragStart (the existing pointer-event
 *         drag engine in useBatchDrag / useEisenhowerDrag takes over).
 *      3. The returned `isHolding` flag becomes true so the card can show the
 *         gold ambient halo + scale-[1.03] CSS while the user is pressing but
 *         the 250 ms hasn't elapsed yet.
 *  - On pointerup / pointercancel the body touch-action lock is cleared.
 *
 * @param {Object} opts
 * @param {(taskId: string, title: string, clientX: number, clientY: number, ...rest: any[]) => void} opts.onDragStart
 * @param {number} [opts.holdMs=250]   - Hold duration before drag activates.
 * @param {number} [opts.moveThreshold=6] - Pixel movement that cancels the hold.
 */
export function useLongPressDrag({
  onDragStart,
  holdMs = 250,
  moveThreshold = 6,
}) {
  const [isHolding, setIsHolding] = useState(false);
  const timerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const pendingRef = useRef(
    /** @type {{ x: number; y: number; pointerId: number; taskId: string; taskTitle: string; extra: any[] } | null} */ (null)
  );

  const cancelHold = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsHolding(false);
    pendingRef.current = null;
  }, []);

  const releaseTouchLock = useCallback(() => {
    document.body.style.touchAction = "";
    document.documentElement.style.overscrollBehavior = "";
  }, []);

  const handlePointerDown = useCallback(
    (e, taskId, taskTitle, ...extra) => {
      if (e.button !== 0 && e.pointerType !== "touch") return;

      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;

      pendingRef.current = { x: startX, y: startY, pointerId, taskId, taskTitle, extra };
      setIsHolding(true);

      const cleanup = () => {
        cancelHold();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      const onMove = (ev) => {
        if (!pendingRef.current || ev.pointerId !== pendingRef.current.pointerId) return;
        const dx = ev.clientX - pendingRef.current.x;
        const dy = ev.clientY - pendingRef.current.y;
        if (Math.hypot(dx, dy) >= moveThreshold) {
          cleanup();
        }
      };

      const onUp = () => {
        cleanup();
        releaseTouchLock();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const pending = pendingRef.current;
        if (!pending) return;

        /* Lock body scrolling for the drag session duration */
        document.body.style.touchAction = "none";
        document.documentElement.style.overscrollBehavior = "none";

        setIsHolding(false);
        pendingRef.current = null;

        onDragStart(pending.taskId, pending.taskTitle, e.clientX, e.clientY, ...pending.extra);

        /* Touch-action lock is cleared by the existing useBatchDrag /
           useEisenhowerDrag pointerup handler which fires via window listeners;
           we also set a safety release here via the onUp listener above. */
      }, holdMs);
    },
    [onDragStart, holdMs, moveThreshold, cancelHold, releaseTouchLock]
  );

  return {
    /** True while the 300ms hold is counting down (show visual feedback). */
    isHolding,
    handlePointerDown,
    cancelHold,
  };
}
