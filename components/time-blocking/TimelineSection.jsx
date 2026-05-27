"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  formatSectionRangeLabel,
  getSectionHours,
} from "@/lib/timeBlocking";
import { TimelineRunwaySlot } from "./TimelineRunwaySlot";

/**
 * @param {Object} props
 * @param {import('@/lib/timeBlocking').TimelineSectionConfig} props.section
 * @param {Record<number, import('@/types/interfaces').Task | null>} props.slotMap
 * @param {number | null} props.currentHour
 * @param {(hour: number, event: React.MouseEvent) => void} props.onRequestAllocate
 * @param {(taskId: string) => void} props.onClear
 */
export function TimelineSection({
  section,
  slotMap,
  currentHour,
  onRequestAllocate,
  onClear,
}) {
  const [expanded, setExpanded] = useState(section.defaultExpanded);
  const hours = getSectionHours(section);
  const assignedCount = hours.filter((h) => slotMap[h]).length;

  return (
    <section className="overflow-hidden rounded-4xl border border-white/60 bg-white/35 shadow-glass">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/30"
      >
        <div>
          <h3 className="font-display text-base font-semibold tracking-tight text-charcoal">
            {section.title}
          </h3>
          <p className="mt-0.5 text-xs text-charcoal/45">
            {formatSectionRangeLabel(section)}
            {assignedCount > 0 && (
              <span className="ml-2 rounded-full bg-gold/25 px-2 py-0.5 font-medium text-charcoal">
                {assignedCount} blocked
              </span>
            )}
          </p>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-charcoal/60 shadow-glass"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-2 border-t border-white/50 px-4 py-4 sm:px-5">
              {hours.map((hour) => (
                <TimelineRunwaySlot
                  key={hour}
                  hour={hour}
                  assignedTask={slotMap[hour] ?? null}
                  isCurrentHour={currentHour === hour}
                  onRequestAllocate={onRequestAllocate}
                  onClear={() => {
                    const task = slotMap[hour];
                    if (task) onClear(task.id);
                  }}
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
