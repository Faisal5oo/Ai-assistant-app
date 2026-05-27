"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatHourLabel } from "@/lib/timeBlocking";
import { AssignedTaskCard } from "./AssignedTaskCard";

/**
 * @param {Object} props
 * @param {number} props.hour
 * @param {import('@/types/interfaces').Task | null} props.assignedTask
 * @param {boolean} props.isCurrentHour
 * @param {(hour: number, event: React.MouseEvent) => void} props.onRequestAllocate
 * @param {() => void} props.onClear
 */
export function TimelineRunwaySlot({
  hour,
  assignedTask,
  isCurrentHour,
  onRequestAllocate,
  onClear,
}) {
  const isEmpty = !assignedTask;

  const runwayClass = `relative flex min-h-[56px] w-full items-center rounded-3xl border px-4 py-2 transition-shadow ${
    isCurrentHour
      ? "border-gold/45 bg-gold/5 shadow-[0_0_0_1px_rgba(250,204,21,0.25)]"
      : "border-white/65 bg-white/40 shadow-glass"
  }`;

  return (
    <motion.li
      layout
      className="group grid list-none grid-cols-[72px_1fr] items-stretch gap-3 sm:grid-cols-[88px_1fr]"
    >
      <div className="flex flex-col justify-center py-1">
        <span
          className={`font-display text-sm font-semibold tracking-tight ${
            isCurrentHour ? "text-charcoal" : "text-charcoal/55"
          }`}
        >
          {formatHourLabel(hour)}
        </span>
        {isCurrentHour && (
          <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-dark">
            Now
          </span>
        )}
      </div>

      {isEmpty ? (
        <motion.button
          type="button"
          layout
          onClick={(e) => onRequestAllocate(hour, e)}
          whileHover={{ backgroundColor: "rgba(250, 204, 21, 0.08)" }}
          transition={{ duration: 0.2 }}
          className={`${runwayClass} cursor-pointer hover:border-gold/25`}
        >
          <span className="text-sm font-medium tracking-wide text-charcoal/40 opacity-45 transition group-hover:opacity-70">
            + Allocate Task
          </span>
        </motion.button>
      ) : (
        <motion.div layout className={runwayClass}>
          <AnimatePresence mode="wait">
            <AssignedTaskCard
              key={assignedTask.id}
              task={assignedTask}
              onClear={onClear}
            />
          </AnimatePresence>
        </motion.div>
      )}
    </motion.li>
  );
}
