"use client";

import { motion } from "framer-motion";
import { Layers, Target } from "lucide-react";
import { resolveEisenhowerQuadrant } from "@/lib/eisenhower";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.selectedId
 * @param {(id: string) => void} props.onSelect
 */
export function TargetTaskDeck({ tasks, selectedId, onSelect }) {
  if (tasks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-charcoal/15 bg-white/40 px-4 py-6 text-center text-sm text-charcoal/45">
        No active tasks in your runway. Add tasks from the dashboard first.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {tasks.map((task, index) => {
        const selected = selectedId === task.id;
        const isQ1 = resolveEisenhowerQuadrant(task) === 1;
        const batchTag = task.tags[0];

        return (
          <motion.button
            key={task.id}
            type="button"
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            onClick={() => onSelect(task.id)}
            className={`flex min-w-0 flex-1 flex-col rounded-3xl border px-4 py-4 text-left transition-all duration-300 ${
              selected
                ? "border-gold/50 bg-gold/15 shadow-[0_8px_32px_rgba(234,179,8,0.15)]"
                : "border-white/80 bg-white/55 hover:border-gold/30 hover:bg-white/70"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                  selected ? "text-gold-dark" : "text-charcoal/35"
                }`}
              >
                Target {index + 1}
              </span>
              {isQ1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-charcoal">
                  <Target size={10} />
                  Q1
                </span>
              )}
            </div>
            <p className="line-clamp-2 font-display text-sm font-semibold tracking-wide text-charcoal">
              {task.title}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-charcoal/45">
              <span className="capitalize">{task.status}</span>
              {batchTag && (
                <span className="inline-flex items-center gap-1 rounded-full bg-charcoal/5 px-2 py-0.5">
                  <Layers size={10} />
                  {batchTag}
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
