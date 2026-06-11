"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { SessionTimerText } from "@/components/timer/SessionTimerText";

const BAR_SPRING = { type: "spring", stiffness: 250, damping: 25 };
const GRADIENT_LOOP = {
  backgroundPosition: ["0% 50%", "200% 50%", "0% 50%"],
};
const GRADIENT_TRANSITION = {
  backgroundPosition: { duration: 4, repeat: Infinity, ease: "linear" },
};

const DEFAULT_PROJECT_LABEL = "Main project";

/**
 * Centered header status bar — Tron-inspired black & gold active state.
 */
export function ActiveTaskStatusBar() {
  const { tasks } = useTasks();
  const taskId = useTaskStore((s) => s.activeTimer.taskId);
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const activeTask = taskId ? tasks.find((t) => t.id === taskId) : null;
  const visible = Boolean(taskId && activeTask);

  const projectLabel =
    activeTask?.tags?.[0] ?? activeTask?.category ?? DEFAULT_PROJECT_LABEL;

  return (
    <AnimatePresence initial={false} mode="popLayout">
      {visible && (
        <motion.div
          key="active-task-status-bar"
          layout
          initial={{ opacity: 0, y: -14, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.92 }}
          transition={BAR_SPRING}
          className="w-full max-w-xl"
        >
          <div className="relative rounded-2xl p-[1.5px]">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl will-change-transform"
              initial={false}
              animate={
                isRunning
                  ? GRADIENT_LOOP
                  : { backgroundPosition: "0% 50%" }
              }
              transition={
                isRunning ? GRADIENT_TRANSITION : { duration: 0.35 }
              }
              style={{
                background:
                  "linear-gradient(90deg, #09090b 0%, #a16207 25%, #facc15 50%, #a16207 75%, #09090b 100%)",
                backgroundSize: "200% 100%",
              }}
            />

            {isRunning && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-md will-change-transform"
                initial={false}
                animate={GRADIENT_LOOP}
                transition={GRADIENT_TRANSITION}
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, #facc15 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                }}
              />
            )}

            <div className="relative z-10 flex items-center gap-3 rounded-[14px] bg-zinc-950 px-4 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold tracking-tight text-white">
                  {activeTask?.title}
                </p>
                <p className="truncate text-[11px] text-zinc-400">
                  {projectLabel}
                </p>
              </div>

              <div className="hidden shrink-0 sm:block">
                <p className="font-display text-lg font-semibold tabular-nums tracking-tight text-gold">
                  <SessionTimerText />
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  isRunning
                    ? "bg-gold/15 text-gold ring-1 ring-gold/40"
                    : "bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700"
                }`}
              >
                {isRunning ? "Running" : "Paused"}
              </span>
            </div>
          </div>

          <p className="mt-1 text-center font-display text-sm font-semibold tabular-nums text-gold sm:hidden">
            <SessionTimerText />
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
