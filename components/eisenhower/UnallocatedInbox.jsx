"use client";

import { motion } from "framer-motion";
import { Inbox } from "lucide-react";
import { EISENHOWER_INBOX_ZONE, EISENHOWER_SPRING } from "@/lib/eisenhower";
import { EisenhowerTaskCard } from "./EisenhowerTaskCard";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.draggingTaskId
 * @param {boolean} props.isHoverTarget
 * @param {(taskId: string, title: string, x: number, y: number, zone: string) => void} props.onDragStart
 */
export function UnallocatedInbox({
  tasks,
  draggingTaskId,
  isHoverTarget,
  onDragStart,
}) {
  return (
    <motion.aside
      data-eisenhower-zone={EISENHOWER_INBOX_ZONE}
      animate={{
        scale: isHoverTarget ? 1.01 : 1,
      }}
      transition={EISENHOWER_SPRING}
      className="eisenhower-drop-zone flex h-full min-h-[320px] w-full flex-col rounded-4xl border border-white/60 bg-white/50 p-4 shadow-glass backdrop-blur-glass lg:max-w-[240px] lg:shrink-0"
      style={{
        backgroundColor: isHoverTarget
          ? "rgba(253, 252, 248, 0.95)"
          : undefined,
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-charcoal/[0.06] text-charcoal/70">
          <Inbox size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-charcoal">
            Unallocated Inbox
          </h2>
          <p className="text-[11px] text-charcoal/45">
            {tasks.length} awaiting triage
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="py-8 text-center text-xs text-charcoal/35">
            All tasks categorized
          </p>
        ) : (
          tasks.map((task) => (
            <EisenhowerTaskCard
              key={task.id}
              task={task}
              zone={EISENHOWER_INBOX_ZONE}
              isDragging={draggingTaskId === task.id}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </motion.aside>
  );
}
