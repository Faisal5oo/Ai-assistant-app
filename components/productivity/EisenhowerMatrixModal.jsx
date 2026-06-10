"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play } from "lucide-react";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useTaskStore } from "@/store/useTaskStore";
import { resolveEisenhowerQuadrant, QUADRANT_META } from "@/lib/eisenhower";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(message: string) => void} props.onFeedback
 */
export function EisenhowerMatrixModal({ open, onClose, onFeedback }) {
  const { tasks } = useTasks();
  const startEisenhowerTask = useTaskStore((s) => s.startEisenhowerTask);

  const quadrants = useMemo(() => {
    /** @type {Record<import('@/types/interfaces').EisenhowerQuadrant, import('@/types/interfaces').Task[]>} */
    const buckets = { 1: [], 2: [], 3: [], 4: [] };
    for (const task of tasks) {
      if (task.status === "Completed") continue;
      buckets[resolveEisenhowerQuadrant(task)].push(task);
    }
    return buckets;
  }, [tasks]);

  const handleStart = (taskId, title) => {
    startEisenhowerTask(taskId);
    onFeedback(`Started “${title}” from matrix`);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-4xl bg-cream-50 p-6 shadow-soft md:p-8"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">
                Eisenhower matrix
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-glass"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2, 3, 4].map((q) => {
                const meta = QUADRANT_META[/** @type {import('@/types/interfaces').EisenhowerQuadrant} */ (q)];
                const list = quadrants[/** @type {import('@/types/interfaces').EisenhowerQuadrant} */ (q)];
                return (
                  <div
                    key={q}
                    className={`rounded-3xl p-4 ${meta.accent}`}
                  >
                    <p className="text-sm font-semibold">{meta.title}</p>
                    <p className="text-[10px] text-charcoal/40">{meta.subtitle}</p>
                    <p className="mb-3 text-xs text-charcoal/50">{meta.hint}</p>
                    <ul className="max-h-40 space-y-2 overflow-y-auto">
                      {list.length === 0 ? (
                        <li className="text-xs text-charcoal/40">No tasks</li>
                      ) : (
                        list.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm"
                          >
                            <span className="truncate font-medium">
                              {task.title}
                            </span>
                            <button
                              type="button"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-charcoal"
                              aria-label={`Start ${task.title}`}
                              onClick={() => handleStart(task.id, task.title)}
                            >
                              <Play size={14} />
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
