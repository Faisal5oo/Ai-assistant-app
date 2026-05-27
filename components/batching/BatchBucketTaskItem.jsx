"use client";

import { X } from "lucide-react";
import { DraggableTaskChip } from "./DraggableTaskChip";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {boolean} props.isDragging
 * @param {(taskId: string, title: string, x: number, y: number) => void} props.onDragStart
 * @param {(taskId: string) => void} props.onRemove
 */
export function BatchBucketTaskItem({
  task,
  isDragging,
  onDragStart,
  onRemove,
}) {
  return (
    <div className="group relative">
      <DraggableTaskChip
        task={task}
        isDragging={isDragging}
        onDragStart={onDragStart}
        compact
      />
      <button
        type="button"
        aria-label={`Remove ${task.title} from batch`}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(task.id);
        }}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-charcoal/40 opacity-0 shadow-glass transition hover:bg-charcoal/8 hover:text-charcoal group-hover:opacity-100"
      >
        <X size={14} strokeWidth={2} />
      </button>
    </div>
  );
}
