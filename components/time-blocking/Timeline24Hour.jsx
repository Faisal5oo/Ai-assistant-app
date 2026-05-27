"use client";

import { useCallback, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { TIMELINE_SECTIONS } from "@/lib/timeBlocking";
import { TaskAllocationPopover } from "./TaskAllocationPopover";
import { TimelineSection } from "./TimelineSection";

/**
 * @param {Object} props
 * @param {Record<number, import('@/types/interfaces').Task | null>} props.slotMap
 * @param {import('@/types/interfaces').Task[]} props.openTasks
 * @param {number} props.currentHour
 * @param {(hour: number, taskId: string) => void} props.onAssign
 * @param {(taskId: string) => void} props.onClear
 */
export function Timeline24Hour({
  slotMap,
  openTasks,
  currentHour,
  onAssign,
  onClear,
}) {
  /** @type {[{ hour: number, x: number, y: number } | null, React.Dispatch<React.SetStateAction<{ hour: number, x: number, y: number } | null>>]} */
  const [popoverAnchor, setPopoverAnchor] = useState(null);

  const handleRequestAllocate = useCallback((hour, event) => {
    setPopoverAnchor({
      hour,
      x: event.clientX + 12,
      y: event.clientY + 8,
    });
  }, []);

  const handleSelect = useCallback(
    (taskId) => {
      if (popoverAnchor) onAssign(popoverAnchor.hour, taskId);
    },
    [popoverAnchor, onAssign]
  );

  return (
    <div className="glass-card p-5 md:p-7">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
          24-hour schedule
        </h2>
        <p className="mt-1 text-sm text-charcoal/50">
          Collapse quiet hours, expand your runway, and allocate with a single
          tap — no dropdowns.
        </p>
      </div>

      <LayoutGroup>
        <div className="flex flex-col gap-4">
          {TIMELINE_SECTIONS.map((section) => (
            <TimelineSection
              key={section.id}
              section={section}
              slotMap={slotMap}
              currentHour={currentHour}
              onRequestAllocate={handleRequestAllocate}
              onClear={onClear}
            />
          ))}
        </div>
      </LayoutGroup>

      <TaskAllocationPopover
        anchor={popoverAnchor}
        tasks={openTasks}
        onSelect={handleSelect}
        onClose={() => setPopoverAnchor(null)}
      />
    </div>
  );
}
