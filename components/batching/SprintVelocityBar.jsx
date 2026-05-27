"use client";

import { motion } from "framer-motion";
import { TaskBlockTimer } from "./TaskBlockTimer";

/**
 * @param {Object} props
 * @param {number} props.currentIndex
 * @param {number} props.total
 * @param {string | null} props.taskId
 * @param {boolean} props.timerActive
 */
export function SprintVelocityBar({ currentIndex, total, taskId, timerActive }) {
  const progress =
    total > 0 ? (Math.max(0, currentIndex - 1) / total) * 100 : 0;

  return (
    <header className="shrink-0 border-b border-charcoal/5 bg-cream-50/95 backdrop-blur-md">
      <div className="px-4 py-3 lg:px-8">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/45">
            Task {Math.min(currentIndex, total)} of {total} in progress
          </p>
          <TaskBlockTimer taskId={taskId} active={timerActive} />
        </div>
        <div className="stat-bar-track h-1.5">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-light via-gold to-gold-dark"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
      </div>
    </header>
  );
}
