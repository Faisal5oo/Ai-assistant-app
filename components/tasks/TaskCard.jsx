"use client";

import { useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GripVertical,
  Hourglass,
  Pencil,
  Play,
  Tag,
  Timer,
  Trash2,
} from "lucide-react";
import { FocusQueueBadge } from "@/components/tasks/FocusQueueBadge";
import { formatMsToHoursMinutes } from "@/lib/utils";
import { KANBAN_MORPH_SPRING } from "@/lib/kanban";

const DRAG_THRESHOLD_PX = 5;

const CARD_LAYOUT_TWEEN = KANBAN_MORPH_SPRING;

const PRIORITY_STYLES = {
  Low: "bg-charcoal/10 text-charcoal/70",
  Medium: "bg-gold/30 text-charcoal",
  High: "bg-charcoal text-white",
};

const CATEGORY_STYLES = {
  Work: "border-l-charcoal",
  Personal: "border-l-gold",
  Learning: "border-l-blue-400",
  Health: "border-l-emerald-400",
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {import('@/types/interfaces').TaskStatus} props.status
 * @param {boolean} props.isDragging
 * @param {boolean} [props.isFocusRunning]
 * @param {boolean} [props.isFocusPaused]
 * @param {boolean} [props.isInQueue]
 * @param {boolean} [props.isHighlighted]
 * @param {() => void} [props.onActivate]
 * @param {(taskId: string, title: string, x: number, y: number, sourceStatus: string) => void} props.onDragStart
 * @param {() => void} props.onEdit
 * @param {() => void} props.onDelete
 */
export function TaskCard({
  task,
  status,
  isDragging,
  isFocusRunning = false,
  isFocusPaused = false,
  isInQueue = false,
  isHighlighted = false,
  onActivate,
  onDragStart,
  onEdit,
  onDelete,
}) {
  const dragPendingRef = useRef(
    /** @type {{ x: number; y: number; pointerId: number } | null} */ (null)
  );

  const commitDrag = useCallback(
    (clientX, clientY) => {
      onDragStart(task.id, task.title, clientX, clientY, status);
    },
    [onDragStart, task.id, task.title, status]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("[data-kanban-no-drag]")) return;

      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;
      dragPendingRef.current = { x: startX, y: startY, pointerId };

      const cleanup = () => {
        dragPendingRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      const onMove = (ev) => {
        if (
          !dragPendingRef.current ||
          ev.pointerId !== dragPendingRef.current.pointerId
        ) {
          return;
        }
        const dx = ev.clientX - dragPendingRef.current.x;
        const dy = ev.clientY - dragPendingRef.current.y;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          cleanup();
          commitDrag(ev.clientX, ev.clientY);
        }
      };

      const onUp = () => {
        cleanup();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [commitDrag]
  );

  return (
    <div className="relative select-none">
      {isDragging && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 min-h-[5.5rem] rounded-2xl border border-dashed border-gold/25 bg-gold/[0.06]"
        />
      )}

      <motion.div
        initial={false}
        animate={{ opacity: isDragging ? 0 : 1 }}
        transition={CARD_LAYOUT_TWEEN}
        className="relative"
      >
        <motion.div
          layout
          drag={false}
          onPointerDown={handlePointerDown}
          className={`glass-card group relative w-full cursor-grab overflow-hidden border-l-4 p-4 active:cursor-grabbing [touch-action:none] [-webkit-user-drag:none] ${
            isDragging ? "invisible" : ""
          } ${CATEGORY_STYLES[task.category]} ${
            isHighlighted
              ? "ring-2 ring-gold/70 shadow-[0_0_32px_rgba(250,204,21,0.30)]"
              : isFocusRunning
                ? "ring-2 ring-gold/55 shadow-[0_0_24px_rgba(250,204,21,0.2)]"
                : ""
          }`}
          style={{
            WebkitTouchCallout: "none",
            userSelect: "none",
          }}
          transition={CARD_LAYOUT_TWEEN}
        >
          {/* Slow gold shimmer overlay — fades in, pulses twice, then out */}
          <AnimatePresence>
            {isHighlighted && (
              <motion.div
                key="highlight-shimmer"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.9, 0.45, 0.75, 0.25, 0] }}
                exit={{ opacity: 0, transition: { duration: 0.5 } }}
                transition={{ duration: 4.5, ease: "easeInOut" }}
                className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-gold/30 via-amber-200/20 to-transparent"
              />
            )}
          </AnimatePresence>
          <div className="mb-3 flex items-start gap-2">
            <div
              className="mt-0.5 shrink-0 text-slate-500/60 transition-colors duration-200 group-hover:text-slate-800"
              aria-hidden
            >
              <GripVertical size={14} strokeWidth={2.5} />
            </div>
            <h4 className="min-w-0 flex-1 font-display text-sm font-semibold leading-snug tracking-tight text-charcoal">
              {task.title}
            </h4>
            {isFocusPaused && <FocusQueueBadge variant="paused" />}
            {isInQueue && <FocusQueueBadge variant="queued" />}
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-charcoal/55">
            <span className="inline-flex items-center gap-1">
              <Hourglass size={12} className="shrink-0 text-charcoal/35" />
              <span className="tabular-nums">{task.estimatedTime}m</span>
            </span>
            {task.actualTimeSpent > 0 && (
              <span className="inline-flex items-center gap-1">
                <Timer size={12} className="shrink-0 text-charcoal/35" />
                <span>{formatMsToHoursMinutes(task.actualTimeSpent)}</span>
              </span>
            )}
            <span
              className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_STYLES[task.priority]}`}
            >
              <Tag size={10} strokeWidth={2.5} />
              {task.priority}
            </span>
          </div>

          {task.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-charcoal/60"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-charcoal/35">
            {task.category}
          </p>

          <div className="flex gap-2" data-kanban-no-drag>
            {(isInQueue || isFocusPaused) && onActivate && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onActivate}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-gold/25 py-2 text-xs font-medium text-charcoal transition hover:bg-gold/40"
              >
                <Play size={12} /> Focus
              </button>
            )}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-white/60 py-2 text-xs font-medium transition hover:bg-white"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/60 text-red-600 transition hover:bg-red-50"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
