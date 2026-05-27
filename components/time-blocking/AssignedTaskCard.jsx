"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { taskLayoutId } from "@/lib/timeBlocking";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {() => void} props.onClear
 */
export function AssignedTaskCard({ task, onClear }) {
  return (
    <motion.div
      layout
      layoutId={taskLayoutId(task.id)}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/80 bg-white/75 py-2.5 pl-4 pr-2 shadow-glass"
      style={{ borderLeftWidth: "4px", borderLeftColor: "#FACC15" }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium tracking-tight text-charcoal">
          {task.title}
        </p>
        <p className="text-xs text-charcoal/45">
          {task.category}
          {task.priority === "High" && (
            <span className="ml-2 rounded-full bg-gold/30 px-1.5 py-0.5 font-semibold text-charcoal">
              High
            </span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClear();
        }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-charcoal/40 transition hover:bg-charcoal/8 hover:text-charcoal"
        aria-label={`Clear ${task.title} from block`}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}
