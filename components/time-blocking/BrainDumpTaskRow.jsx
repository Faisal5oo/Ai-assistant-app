"use client";

import { motion } from "framer-motion";
import { Clock, PieChart } from "lucide-react";
import { taskLayoutId } from "@/lib/timeBlocking";
import {
  getTaskAllocatedMinutes,
  getTaskRemainingMinutes,
} from "@/lib/time-block-allocations";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 */
export function BrainDumpTaskRow({ task }) {
  const allocated = getTaskAllocatedMinutes(task);
  const remaining = getTaskRemainingMinutes(task);
  const hasPartial = allocated > 0 && remaining > 0;
  const progress = Math.min(100, (allocated / task.estimatedTime) * 100);

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

      {hasPartial && (
        <div className="mt-2.5">
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-charcoal/40">
            <span className="inline-flex items-center gap-1">
              <PieChart size={10} />
              Runway coverage
            </span>
            <span className="tabular-nums text-gold-dark">{remaining}m left</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-charcoal/45">
        <span className="rounded-full bg-charcoal/[0.05] px-2 py-0.5">
          {task.category}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={11} />
          {hasPartial ? (
            <>
              <span className="tabular-nums">{remaining}m remaining</span>
              <span className="text-charcoal/30">·</span>
              <span className="tabular-nums text-charcoal/35">
                {allocated}/{task.estimatedTime}m blocked
              </span>
            </>
          ) : (
            <span className="tabular-nums">{task.estimatedTime}m</span>
          )}
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
