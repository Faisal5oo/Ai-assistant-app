"use client";

import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { SessionTimerText } from "@/components/timer/SessionTimerText";

export function ActiveSessionBar() {
  const { tasks } = useTasks();
  const activeTechnique = useTaskStore((s) => s.activeTechnique);
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const taskId = useTaskStore((s) => s.activeTimer.taskId);
  const taskTitle = taskId
    ? tasks.find((t) => t.id === taskId)?.title ?? null
    : null;

  if (!isRunning && !activeTechnique) return null;

  const label = activeTechnique?.replace(/-/g, " ") ?? "Work";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-dark mb-6 flex flex-wrap items-center justify-between gap-4 p-4"
    >
      <div>
        <p className="text-sm text-white/60">Active session</p>
        <p className="font-display text-xl font-semibold capitalize">
          {label} · <SessionTimerText />
        </p>
        {taskTitle && (
          <p className="text-sm text-white/70">{taskTitle}</p>
        )}
      </div>
      <span className="rounded-full bg-gold px-4 py-1 text-sm font-semibold text-charcoal">
        {isRunning ? "Running" : "Paused"}
      </span>
    </motion.div>
  );
}
