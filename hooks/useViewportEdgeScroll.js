"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Automatic viewport edge-scroll during active pointer drags.
 *
 * When an active drag is in progress (isDragging === true) this hook
 * subscribes to `pointermove` and checks whether the current pointer Y
 * position is within the top or bottom edge zones.  If so it drives a
 * continuous `requestAnimationFrame` scroll loop on
 * `document.documentElement` until the pointer leaves the zone or the drag
 * ends.
 *
 * Edge zone sizes are expressed as a fraction of `window.innerHeight`.
 *
 * @param {Object} opts
 * @param {boolean} opts.isDragging  - Activate the sensor only while true.
 * @param {number}  [opts.edgeFraction=0.15]  - Fraction of vh triggering scroll (0.15 = 15%).
 * @param {number}  [opts.maxSpeed=18]         - Max scroll px per animation frame.
 */
export function useViewportEdgeScroll({
  isDragging,
  edgeFraction = 0.15,
  maxSpeed = 18,
}) {
  const rafRef = useRef(/** @type {number | null} */ (null));
  const pointerYRef = useRef(0);
  const isActiveRef = useRef(false);

  const stopLoop = useCallback(() => {
    isActiveRef.current = false;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const runLoop = useCallback(() => {
    if (!isActiveRef.current) return;

    const vh = window.innerHeight;
    const py = pointerYRef.current;
    const topEdge = vh * edgeFraction;
    const bottomEdge = vh * (1 - edgeFraction);

    let delta = 0;

    if (py < topEdge) {
      /* Pointer is in the top edge zone — scroll up.
         Speed scales linearly: fastest at py=0, zero at topEdge. */
      const ratio = 1 - py / topEdge;
      delta = -Math.round(ratio * maxSpeed);
    } else if (py > bottomEdge) {
      /* Pointer is in the bottom edge zone — scroll down. */
      const ratio = (py - bottomEdge) / (vh - bottomEdge);
      delta = Math.round(ratio * maxSpeed);
    }

    if (delta !== 0) {
      window.scrollBy({ top: delta, behavior: "instant" });
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, [edgeFraction, maxSpeed]);

  useEffect(() => {
    if (!isDragging) {
      stopLoop();
      return undefined;
    }

    const onMove = (e) => {
      pointerYRef.current = e.clientY;

      if (!isActiveRef.current) {
        isActiveRef.current = true;
        rafRef.current = requestAnimationFrame(runLoop);
      }
    };

    /* Stop the rAF loop when the drag ends */
    const onUp = () => {
      stopLoop();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      stopLoop();
    };
  }, [isDragging, runLoop, stopLoop]);
}
