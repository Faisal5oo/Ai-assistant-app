"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 */
export function TimeBlockingModal({ open, onClose }) {
  const tasks = useTaskStore((s) => s.tasks);
  const confirmTimeBlock = useTaskStore((s) => s.confirmTimeBlock);
  const resolveDefaultTaskId = useTaskStore((s) => s.resolveDefaultTaskId);

  const openTasks = tasks.filter((t) => t.status !== "Completed");
  const defaultId = resolveDefaultTaskId() ?? openTasks[0]?.id ?? "";

  const [taskId, setTaskId] = useState(defaultId);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const slot = new Date();
    slot.setMinutes(0, 0, 0);
    slot.setHours(slot.getHours() + 1);
    return slot.toISOString().slice(0, 16);
  });

  const handleSchedule = (startFocus) => {
    if (!taskId || !scheduledAt) return;
    confirmTimeBlock(taskId, new Date(scheduledAt).toISOString(), startFocus);
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
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-4xl bg-cream-50 p-6 shadow-soft"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Time blocking</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-glass"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal/60">
                  Task
                </label>
                <select
                  className="input-field"
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                >
                  {openTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-charcoal/60">
                  Block start
                </label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  className="pill-btn-ghost flex-1"
                  onClick={() => handleSchedule(false)}
                >
                  Save block
                </button>
                <button
                  type="button"
                  className="pill-btn-gold flex-1"
                  onClick={() => handleSchedule(true)}
                >
                  Block & start focus
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
