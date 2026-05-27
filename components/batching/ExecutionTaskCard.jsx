"use client";

import { motion } from "framer-motion";

/** @typedef {import('@/hooks/useBatchingSession').CardExitMode} CardExitMode */

const EXIT_VARIANTS = {
  complete: {
    opacity: 0,
    x: 280,
    rotate: 6,
    transition: { duration: 0.34, ease: [0.4, 0, 0.2, 1] },
  },
  defer: {
    opacity: 0,
    y: 220,
    rotate: -14,
    scale: 0.88,
    transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] },
  },
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {CardExitMode} props.exitMode
 */
export function ExecutionTaskCard({ task, exitMode }) {
  return (
    <motion.div
      key={task.id}
      layout
      initial={{ opacity: 0, scale: 0.9, y: 48 }}
      animate={
        exitMode === "complete" || exitMode === "defer"
          ? EXIT_VARIANTS[exitMode]
          : { opacity: 1, scale: 1, y: 0, rotate: 0 }
      }
      transition={
        exitMode === "complete" || exitMode === "defer"
          ? EXIT_VARIANTS[exitMode].transition
          : { type: "spring", stiffness: 300, damping: 28 }
      }
      className="mx-auto w-full max-w-lg"
    >
      <div className="glass-card border-gold/25 p-8 shadow-soft md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal/40">
          {task.category}
          {task.priority ? ` · ${task.priority}` : ""}
        </p>
        <h3 className="mt-4 font-display text-2xl font-semibold leading-snug text-charcoal md:text-3xl">
          {task.title}
        </h3>
        {task.description && (
          <p className="mt-4 text-sm leading-relaxed text-charcoal/55">
            {task.description}
          </p>
        )}
        {task.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gold/25 px-3 py-1 text-xs font-medium text-charcoal"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="mt-8 text-xs text-charcoal/40">
          Est. {task.estimatedTime} min
        </p>
      </div>
    </motion.div>
  );
}
