"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag } from "lucide-react";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useTaskStore } from "@/store/useTaskStore";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {(message: string) => void} props.onFeedback
 */
export function BatchingModal({ open, onClose, onFeedback }) {
  const { tasks } = useTasks();
  const startBatchSession = useTaskStore((s) => s.startBatchSession);

  const tagGroups = useMemo(() => {
    const map = new Map();
    for (const task of tasks) {
      if (task.status === "Completed") continue;
      for (const tag of task.tags) {
        const key = tag.trim();
        if (!key) continue;
        const list = map.get(key) ?? [];
        list.push(task);
        map.set(key, list);
      }
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [tasks]);

  const handleStart = (tag) => {
    const result = startBatchSession(tag);
    if (result) {
      onFeedback(`Batching “${tag}” — timer started`);
      onClose();
    } else {
      onFeedback("No open tasks found for that tag.");
    }
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
            className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-4xl bg-cream-50 p-6 shadow-soft"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Task batching</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-glass"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mb-4 text-sm text-charcoal/60">
              Group similar work and run one focused session per tag.
            </p>

            {tagGroups.length === 0 ? (
              <p className="rounded-2xl bg-white/60 px-4 py-6 text-center text-sm text-charcoal/50">
                Add tags to your tasks to enable batching.
              </p>
            ) : (
              <ul className="space-y-3">
                {tagGroups.map(([tag, group]) => (
                  <li
                    key={tag}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 p-4 shadow-glass"
                  >
                    <div className="flex items-center gap-2">
                      <Tag size={16} className="text-charcoal/50" />
                      <div>
                        <p className="font-medium">{tag}</p>
                        <p className="text-xs text-charcoal/50">
                          {group.length} task{group.length === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pill-btn-gold shrink-0"
                      onClick={() => handleStart(tag)}
                    >
                      Start batch
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
