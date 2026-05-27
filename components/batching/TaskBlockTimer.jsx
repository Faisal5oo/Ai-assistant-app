"use client";

import { memo, useEffect, useRef, useState } from "react";

function padTwo(n) {
  return String(n).padStart(2, "0");
}

function formatPrecise(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${padTwo(minutes)}:${padTwo(seconds)}.${String(millis).padStart(3, "0")}`;
}

/**
 * Per-task block timer — isolated interval; no parent re-renders.
 * @param {Object} props
 * @param {string | null} props.taskId
 * @param {boolean} props.active
 */
function TaskBlockTimerInner({ taskId, active }) {
  const startedAtRef = useRef(/** @type {number | null} */ (null));
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    startedAtRef.current = taskId ? Date.now() : null;
    setElapsedMs(0);
  }, [taskId]);

  useEffect(() => {
    if (!active || !taskId || !startedAtRef.current) return undefined;

    const tick = () => {
      const start = startedAtRef.current;
      if (!start) return;
      setElapsedMs(Date.now() - start);
    };

    tick();
    const id = window.setInterval(tick, 47);
    return () => window.clearInterval(id);
  }, [active, taskId]);

  return (
    <span
      className="font-display text-sm font-semibold tabular-nums tracking-tight text-charcoal/70"
      aria-live="polite"
    >
      {formatPrecise(elapsedMs)}
    </span>
  );
}

export const TaskBlockTimer = memo(TaskBlockTimerInner);
