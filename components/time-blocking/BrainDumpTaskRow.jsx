"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { taskLayoutId } from "@/lib/timeBlocking";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 */
export function BrainDumpTaskRow({ task }) {
  return (
    <motion.li
      layout
      layoutId={taskLayoutId(task.id)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="relative rounded-2xl border border-charcoal/[0.06] bg-[#fffef9]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 27px, rgba(26,26,26,0.04) 28px)",
      }}
    >
      <p className="font-medium leading-snug tracking-tight text-charcoal">
        {task.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-charcoal/45">
        <span className="rounded-full bg-charcoal/[0.05] px-2 py-0.5">
          {task.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={11} />
          {task.estimatedTime}m
        </span>
        {task.priority === "High" && (
          <span className="rounded-full bg-gold/35 px-2 py-0.5 font-semibold text-charcoal">
            High
          </span>
        )}
      </div>
    </motion.li>
  );
}
