"use client";

import { motion } from "framer-motion";
import { Play, Pause, Square, Clock } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useActivateFocusTask } from "@/hooks/useActivateFocusTask";
import { useTimerTick } from "@/hooks/useTimerTick";
import { formatMsToTimer } from "@/lib/utils";

const RING_SIZE = 160;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function TimerProgressRing() {
  const taskId = useTaskStore((s) => s.activeTimer.taskId);
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const targetMs = useTaskStore((s) => s.activeTimer.targetMs) ?? 25 * 60 * 1000;
  const displayMs = useTimerTick();
  const progress = taskId && isRunning ? Math.min(displayMs / targetMs, 1) : taskId ? displayMs / targetMs : 0;
  const offset = CIRCUMFERENCE * (1 - Math.min(progress, 1));

  return (
    <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(26,26,26,0.08)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#FACC15"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-semibold tabular-nums">
          {formatMsToTimer(displayMs)}
        </span>
        <span className="mt-1 text-xs text-charcoal/50">Work Time</span>
      </div>
    </div>
  );
}

export function TimeTracker() {
  const taskId = useTaskStore((s) => s.activeTimer.taskId);
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const { tasks } = useTasks();
  const { playTopFocus, isPending } = useActivateFocusTask();
  const pauseTimer = useTaskStore((s) => s.pauseTimer);
  const resumeTimer = useTaskStore((s) => s.resumeTimer);
  const stopTimer = useTaskStore((s) => s.stopTimer);

  const activeTask = tasks.find((t) => t.id === taskId);

  const handlePlay = () => {
    if (taskId) {
      if (isRunning) pauseTimer();
      else resumeTimer();
      return;
    }
    playTopFocus();
  };

  return (
    <motion.div
      layout
      className="glass-card relative flex flex-col items-center p-6 md:p-8"
    >
      <p className="mb-4 w-full text-left text-sm font-medium text-charcoal/60">
        Time tracker
      </p>

      <TimerProgressRing />

      {activeTask && (
        <motion.p
          key={activeTask.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mt-3 max-w-full truncate text-center text-sm font-medium"
        >
          {activeTask.title}
        </motion.p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={isPending}
          className="pill-btn-ghost min-w-[88px]"
        >
          {taskId && isRunning ? (
            <>
              <Pause size={16} /> Pause
            </>
          ) : (
            <>
              <Play size={16} /> Play
            </>
          )}
        </button>
        {taskId && (
          <button
            type="button"
            onClick={stopTimer}
            className="pill-btn-ghost min-w-[88px]"
          >
            <Square size={14} /> Stop
          </button>
        )}
      </div>

      <button
        type="button"
        className="absolute bottom-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-charcoal text-white shadow-soft md:static md:mt-4 md:self-end"
        aria-label="Timer settings"
      >
        <Clock size={16} />
      </button>
    </motion.div>
  );
}
