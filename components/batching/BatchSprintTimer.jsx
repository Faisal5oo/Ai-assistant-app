"use client";

import { memo, useEffect, useRef, useState } from "react";
import { formatMsToTimer } from "@/lib/utils";

/**
 * Count-up sprint timer — ticks locally; reports elapsed to parent only on session end.
 * @param {Object} props
 * @param {number | null} props.startedAt
 * @param {boolean} props.active
 * @param {(elapsedMs: number) => void} props.onSessionEnd
 */
function BatchSprintTimerInner({ startedAt, active, onSessionEnd }) {
  const onSessionEndRef = useRef(onSessionEnd);
  const startedAtRef = useRef(startedAt);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd;
  }, [onSessionEnd]);

  useEffect(() => {
    startedAtRef.current = startedAt;
    if (!startedAt) {
      setElapsedMs(0);
    }
  }, [startedAt]);

  useEffect(() => {
    if (!active || !startedAt) return undefined;

    const tick = () => {
      const start = startedAtRef.current;
      if (!start) return;
      setElapsedMs(Date.now() - start);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  useEffect(() => {
    if (active) return undefined;
    if (elapsedMs > 0) {
      onSessionEndRef.current(elapsedMs);
    }
    return undefined;
  }, [active, elapsedMs]);

  useEffect(() => {
    return () => {
      const start = startedAtRef.current;
      if (!start) return;
      const ms = Date.now() - start;
      if (ms > 0) {
        onSessionEndRef.current(ms);
      }
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-charcoal/40">
        Batch sprint
      </span>
      <span className="mt-1 font-display text-4xl font-semibold tabular-nums tracking-tight text-charcoal md:text-5xl">
        {formatMsToTimer(elapsedMs)}
      </span>
    </div>
  );
}

export const BatchSprintTimer = memo(BatchSprintTimerInner);
