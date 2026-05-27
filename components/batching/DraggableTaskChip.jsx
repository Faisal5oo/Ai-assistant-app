"use client";

import { GripVertical } from "lucide-react";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {boolean} props.isDragging
 * @param {(taskId: string, title: string, x: number, y: number) => void} props.onDragStart
 * @param {boolean} [props.compact]
 */
export function DraggableTaskChip({
  task,
  isDragging,
  onDragStart,
  compact = false,
}) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        onDragStart(task.id, task.title, e.clientX, e.clientY);
      }}
      style={{
        transform: isDragging ? "scale(0.92)" : undefined,
        opacity: isDragging ? 0.35 : 1,
      }}
      className={`flex w-full cursor-grab touch-none items-center gap-2 rounded-2xl bg-white/80 text-left shadow-glass transition-transform duration-150 active:cursor-grabbing hover:scale-[1.02] ${
        compact ? "px-3 py-2" : "px-3 py-2.5"
      }`}
    >
      <GripVertical size={14} className="shrink-0 text-charcoal/30" />
      <span
        className={`line-clamp-1 flex-1 font-medium text-charcoal ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {task.title}
      </span>
    </button>
  );
}
