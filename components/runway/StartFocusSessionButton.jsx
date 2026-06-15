"use client";

import { motion } from "framer-motion";
import { Play, Square } from "lucide-react";
import { useActivateFocusTask } from "@/hooks/useActivateFocusTask";
import { useTaskStore } from "@/store/useTaskStore";
import { buildRunwayFocusTimerOptions } from "@/lib/runway-focus";

/**
 * Premium manual focus entry — timer only starts on explicit user click.
 * @param {Object} props
 * @param {string} props.taskId
 * @param {number} [props.durationMinutes]
 * @param {"hero" | "compact" | "pill"} [props.variant]
 * @param {string} [props.className]
 */
export function StartFocusSessionButton({
  taskId,
  durationMinutes = 60,
  variant = "pill",
  className = "",
}) {
  const { activate, isPending } = useActivateFocusTask();
  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);
  const isRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const stopTimer = useTaskStore((s) => s.stopTimer);

  const isThisTask = activeTaskId === taskId;
  const isSessionActive = isThisTask && isRunning;

  const handleStart = () => {
    activate(taskId, buildRunwayFocusTimerOptions(durationMinutes));
  };

  if (isSessionActive) {
    return (
      <button
        type="button"
        onClick={stopTimer}
        className={
          variant === "hero"
            ? `inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 ${className}`
            : `pill-btn-gold ${className}`
        }
      >
        <Square size={variant === "compact" ? 14 : 16} />
        End session
      </button>
    );
  }

  const baseHero =
    "relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-gold via-amber-300 to-gold px-6 py-3 text-sm font-bold tracking-wide text-charcoal shadow-[0_0_28px_rgba(250,204,21,0.45)] transition hover:shadow-[0_0_36px_rgba(250,204,21,0.55)] disabled:opacity-60";
  const baseCompact =
    "inline-flex items-center gap-1.5 rounded-full bg-gold/25 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gold transition hover:bg-gold/40 disabled:opacity-60";
  const basePill = "pill-btn-gold";

  const classNames =
    variant === "hero" ? baseHero : variant === "compact" ? baseCompact : basePill;

  return (
    <motion.button
      type="button"
      disabled={isPending}
      onClick={handleStart}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${classNames} ${className}`}
    >
      {variant === "hero" && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          animate={{ x: ["-120%", "120%"] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <Play
        size={variant === "compact" ? 12 : 16}
        fill={variant === "hero" ? "currentColor" : undefined}
        className="relative z-10 shrink-0"
      />
      <span className="relative z-10">
        {variant === "compact" ? "Start focus" : "Start Focus Session"}
      </span>
    </motion.button>
  );
}
