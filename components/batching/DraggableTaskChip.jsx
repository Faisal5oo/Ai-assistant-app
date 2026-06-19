"use client";

import { GripVertical } from "lucide-react";
import { useLongPressDrag } from "@/hooks/useLongPressDrag";

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
  const { isHolding, handlePointerDown } = useLongPressDrag({
    onDragStart,
  });

  const lifting = isHolding && !isDragging;

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        handlePointerDown(e, task.id, task.title);
      }}
      style={{
        transform: isDragging
          ? "scale(0.92)"
          : lifting
            ? "scale(1.03)"
            : undefined,
        opacity: isDragging ? 0.35 : 1,
        zIndex: lifting ? 40 : undefined,
        /* Gold ambient shadow halo during hold */
        boxShadow: lifting
          ? "0 0 0 2px rgba(245,217,126,0.55), 0 8px 32px rgba(245,165,0,0.35), 0 0 56px rgba(245,217,126,0.18)"
          : undefined,
        transition: "transform 150ms ease, box-shadow 200ms ease",
      }}
      className={`relative flex w-full cursor-grab touch-none items-center gap-2 rounded-2xl bg-white/80 text-left shadow-glass active:cursor-grabbing hover:scale-[1.02] ${
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
