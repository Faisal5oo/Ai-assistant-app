"use client";

import { AnimatePresence, motion } from "framer-motion";
import { formatHourLabel } from "@/lib/timeBlocking";
import { SLOT_CAPACITY_MINUTES } from "@/lib/time-block-allocations";
import { AssignedTaskCard } from "./AssignedTaskCard";

/**
 * @param {Object} props
 * @param {number} props.hour
 * @param {import('@/lib/time-block-allocations').SlotAllocation[]} props.allocations
 * @param {number} props.slotUsedMinutes
 * @param {boolean} props.isCurrentHour
 * @param {(hour: number, event: React.MouseEvent) => void} props.onRequestAllocate
 * @param {(taskId: string, hour: number) => void} props.onClear
 * @param {(taskId: string) => Promise<void>} [props.onComplete]
 */
export function TimelineRunwaySlot({
  hour,
  allocations,
  slotUsedMinutes,
  isCurrentHour,
  onRequestAllocate,
  onClear,
  onComplete,
}) {
  const isEmpty = allocations.length === 0;
  const isNearCapacity = slotUsedMinutes >= SLOT_CAPACITY_MINUTES * 0.85;
  const isOverCapacity = slotUsedMinutes > SLOT_CAPACITY_MINUTES;

  const runwayClass = `relative flex min-h-[56px] w-full flex-col justify-center gap-2 rounded-3xl border px-4 py-2 transition-shadow ${
    isOverCapacity
      ? "border-amber-400/60 bg-amber-50/40 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
      : isCurrentHour
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
        {!isEmpty && (
          <span
            className={`mt-1 text-[10px] font-medium tabular-nums ${
              isOverCapacity
                ? "text-amber-700"
                : isNearCapacity
                  ? "text-gold-dark"
                  : "text-charcoal/35"
            }`}
          >
            {slotUsedMinutes}/{SLOT_CAPACITY_MINUTES}m
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
          <AnimatePresence mode="popLayout">
            {allocations.map(({ task, durationMinutes }) => (
              <AssignedTaskCard
                key={`${task.id}-${hour}`}
                task={task}
                durationMinutes={durationMinutes}
                onClear={() => onClear(task.id, hour)}
                onComplete={onComplete ? () => onComplete(task.id) : undefined}
              />
            ))}
          </AnimatePresence>
          {slotUsedMinutes < SLOT_CAPACITY_MINUTES && (
            <button
              type="button"
              onClick={(e) => onRequestAllocate(hour, e)}
              className="self-start rounded-full px-2 py-0.5 text-[11px] font-medium text-charcoal/40 transition hover:bg-gold/10 hover:text-charcoal/70"
            >
              + Add ({SLOT_CAPACITY_MINUTES - slotUsedMinutes}m left)
            </button>
          )}
        </motion.div>
      )}
    </motion.li>
  );
}
