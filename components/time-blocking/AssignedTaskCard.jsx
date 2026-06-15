"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { taskLayoutId } from "@/lib/timeBlocking";
import { TimeBlockVictoryBurst } from "./TimeBlockVictoryBurst";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {number} props.durationMinutes
 * @param {() => void} props.onClear
 * @param {() => Promise<void>} [props.onComplete]
 */
export function AssignedTaskCard({ task, durationMinutes, onClear, onComplete }) {
  const [celebrating, setCelebrating] = useState(false);
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (!onComplete || completing || celebrating) return;
    setCelebrating(true);
    setCompleting(true);

    await new Promise((resolve) => setTimeout(resolve, 720));

    try {
      await onComplete();
    } finally {
      setCelebrating(false);
      setCompleting(false);
    }
  };

  return (
    <motion.div
      layout
      layoutId={taskLayoutId(task.id)}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="relative flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/80 bg-white/75 py-2 pl-3 pr-2 shadow-glass"
      style={{ borderLeftWidth: "4px", borderLeftColor: "#FACC15" }}
    >
      <TimeBlockVictoryBurst active={celebrating} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium tracking-tight text-charcoal">
          {task.title}
        </p>
        <p className="text-xs text-charcoal/45">
          {task.category}
          <span className="ml-2 tabular-nums text-charcoal/55">
            {durationMinutes}m
          </span>
          {task.priority === "High" && (
            <span className="ml-2 rounded-full bg-gold/30 px-1.5 py-0.5 font-semibold text-charcoal">
              High
            </span>
          )}
        </p>
      </div>

      {onComplete && (
        <button
          type="button"
          disabled={completing}
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
          className="relative z-40 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-charcoal transition hover:bg-gold/40 disabled:opacity-50"
          aria-label={`Complete ${task.title}`}
        >
          <Check size={14} strokeWidth={2.5} />
        </button>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="relative z-40 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-charcoal/40 transition hover:bg-charcoal/8 hover:text-charcoal"
        aria-label={`Clear ${task.title} from block`}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
