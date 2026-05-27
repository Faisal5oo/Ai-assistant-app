"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { DraggableTaskChip } from "./DraggableTaskChip";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.unbatched
 * @param {string | null} props.draggingTaskId
 * @param {(taskId: string, title: string, x: number, y: number) => void} props.onDragStart
 */
export function QuickSortPanel({ unbatched, draggingTaskId, onDragStart }) {
  return (
    <motion.aside
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      data-batch-drop="pool"
      className="batch-drop-zone glass-card fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-4xl border-gold/15 p-4 lg:left-auto lg:right-8 lg:max-w-md"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-gold-dark" />
          <h3 className="font-display text-sm font-semibold text-charcoal">
            Quick sort pool
          </h3>
        </div>
        <span className="rounded-full bg-charcoal/8 px-2.5 py-0.5 text-xs font-semibold text-charcoal">
          {unbatched.length}
        </span>
      </div>
      <p className="mb-3 text-[11px] leading-relaxed text-charcoal/45">
        Drag tasks into any bucket — or drop here to return them to the pool.
      </p>

      {unbatched.length === 0 ? (
        <p className="rounded-2xl bg-cream-100/60 py-6 text-center text-xs text-charcoal/40 [&.batch-drop-active]:bg-gold/10 [&.batch-drop-active]:text-charcoal/55">
          <span className="[&.batch-drop-active]:hidden">
            All active tasks are batched. Sprint when ready.
          </span>
          <span className="hidden [&.batch-drop-active]:inline">
            Release to return task to the pool
          </span>
        </p>
      ) : (
        <ul className="flex max-h-36 flex-col gap-2 overflow-y-auto pr-1">
          {unbatched.map((task) => (
            <li key={task.id}>
              <DraggableTaskChip
                task={task}
                isDragging={draggingTaskId === task.id}
                onDragStart={onDragStart}
              />
            </li>
          ))}
        </ul>
      )}
    </motion.aside>
  );
}
