"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { formatHourRangeLabel } from "@/lib/timeBlocking";

const POPOVER_WIDTH = 272;
const POPOVER_MAX_HEIGHT = 320;

/**
 * @param {Object} props
 * @param {{ hour: number, x: number, y: number } | null} props.anchor
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {(taskId: string) => void} props.onSelect
 * @param {() => void} props.onClose
 */
export function TaskAllocationPopover({ anchor, tasks, onSelect, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!anchor) return undefined;

    const handlePointer = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      onClose();
    };

    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;

  const clampedLeft = anchor
    ? Math.min(anchor.x, window.innerWidth - POPOVER_WIDTH - 16)
    : 0;
  const clampedTop = anchor
    ? Math.min(anchor.y, window.innerHeight - POPOVER_MAX_HEIGHT - 16)
    : 0;

  return createPortal(
    <AnimatePresence>
      {anchor && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label="Allocate task"
          initial={{ opacity: 0, scale: 0.94, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 6 }}
          transition={{ type: "spring", stiffness: 480, damping: 34 }}
          className="fixed z-[100] overflow-hidden rounded-3xl border border-white/70 bg-cream-50/95 shadow-soft backdrop-blur-glass"
          style={{
            left: clampedLeft,
            top: clampedTop,
            width: POPOVER_WIDTH,
            maxHeight: POPOVER_MAX_HEIGHT,
          }}
        >
          <div className="border-b border-charcoal/8 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/40">
              Allocate task
            </p>
            <p className="font-display text-sm font-semibold text-charcoal">
              {formatHourRangeLabel(anchor.hour)}
            </p>
          </div>

          <ul className="max-h-56 overflow-y-auto p-2">
            {tasks.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-charcoal/45">
                No tasks available. Add tasks from the Tasks page first.
              </li>
            ) : (
              tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(task.id);
                      onClose();
                    }}
                    className="w-full rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-charcoal transition hover:bg-gold/15"
                  >
                    {task.title}
                    <span className="mt-0.5 block text-xs font-normal text-charcoal/45">
                      {task.category} · {task.estimatedTime}m
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
