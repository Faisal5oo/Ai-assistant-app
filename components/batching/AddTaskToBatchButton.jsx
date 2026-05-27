"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string} props.bucketId
 * @param {Record<string, string>} props.overrides
 * @param {(taskId: string, bucketId: string) => void} props.onAssign
 */
export function AddTaskToBatchButton({ tasks, bucketId, overrides, onAssign }) {
  const [open, setOpen] = useState(false);

  const candidates = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "Completed") return false;
      return overrides[t.id] !== bucketId;
    });
  }, [tasks, bucketId, overrides]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-charcoal/70 shadow-glass transition hover:bg-gold/20 hover:text-charcoal"
      >
        <Plus size={12} />
        Add task to batch
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-white/70 bg-cream-50 p-2 shadow-soft"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-charcoal/50">Assign task</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1 text-charcoal/40 hover:bg-white"
              >
                <X size={14} />
              </button>
            </div>
            {candidates.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs text-charcoal/45">
                No other active tasks
              </p>
            ) : (
              <ul className="max-h-40 space-y-1 overflow-y-auto">
                {candidates.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      className="w-full rounded-xl px-2 py-2 text-left text-xs font-medium text-charcoal transition hover:bg-gold/25"
                      onClick={() => {
                        onAssign(task.id, bucketId);
                        setOpen(false);
                      }}
                    >
                      {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
