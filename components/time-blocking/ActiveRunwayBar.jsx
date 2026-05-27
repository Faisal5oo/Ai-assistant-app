"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Square } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTimerTick } from "@/hooks/useTimerTick";
import { formatHourRangeLabel, getHourProgress } from "@/lib/timeBlocking";
import { formatMsToTimer } from "@/lib/utils";

/**
 * Progress tick isolated here — does not touch Zustand or the timeline grid.
 * @param {Object} props
 * @param {import('@/types/interfaces').Task | null} props.activeTask
 * @param {number} props.currentHour
 */
export function ActiveRunwayBar({ activeTask, currentHour }) {
  const [now, setNow] = useState(() => new Date());
  const startTimer = useTaskStore((s) => s.startTimer);
  const stopTimer = useTaskStore((s) => s.stopTimer);
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);
  const displayMs = useTimerTick();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const progress = useMemo(() => getHourProgress(now) * 100, [now]);
  const rangeLabel = formatHourRangeLabel(currentHour);
  const isFocusOnBlock =
    isRunning && activeTask && activeTaskId === activeTask.id;

  const handleFocus = () => {
    if (!activeTask) return;
    if (isFocusOnBlock) {
      stopTimer();
      return;
    }
    startTimer(activeTask.id, {
      mode: "work",
      technique: "time-blocking",
      targetMs: 60 * 60 * 1000,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-dark mb-6 overflow-hidden p-5 md:p-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/50">
            Active runway · now
          </p>
          <p className="font-display text-xl font-semibold tracking-tight">
            {rangeLabel}
          </p>
          {activeTask ? (
            <p className="mt-1 text-sm text-white/75">{activeTask.title}</p>
          ) : (
            <p className="mt-1 text-sm text-white/60">
              No task on this hour — tap an empty slot to allocate.
            </p>
          )}
        </div>
        {activeTask && (
          <button
            type="button"
            onClick={handleFocus}
            className="pill-btn-gold shrink-0"
          >
            {isFocusOnBlock ? (
              <>
                <Square size={16} />
                Stop focus
              </>
            ) : (
              <>
                <Play size={16} />
                Start focus
              </>
            )}
          </button>
        )}
      </div>

      <div className="stat-bar-track bg-white/15">
        <motion.div
          className="h-full rounded-full bg-gold pattern-stripes"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <div className="mt-2 flex justify-between text-xs text-white/55">
        <span>{Math.round(progress)}% through this hour</span>
        {isFocusOnBlock && (
          <span className="tabular-nums">{formatMsToTimer(displayMs)} elapsed</span>
        )}
      </div>
    </motion.div>
  );
}
