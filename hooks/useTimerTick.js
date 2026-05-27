"use client";

import { useEffect, useMemo, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { computeDisplayMs } from "@/lib/timerUtils";

/** Local tick + primitive store fields — avoids Zustand re-subscribe on every ms change */
export function useTimerTick() {
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const taskId = useTaskStore((s) => s.activeTimer.taskId);
  const startedAt = useTaskStore((s) => s.activeTimer.startedAt);
  const elapsedMs = useTaskStore((s) => s.activeTimer.elapsedMs);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => {
      useTaskStore.getState().tickTimer();
      setTick((n) => n + 1);
    }, 100);
    return () => clearInterval(id);
  }, [isRunning]);

  return useMemo(() => {
    void tick;
    return computeDisplayMs({
      taskId,
      isRunning,
      startedAt,
      elapsedMs,
      mode: "work",
    });
  }, [tick, taskId, isRunning, startedAt, elapsedMs]);
}
