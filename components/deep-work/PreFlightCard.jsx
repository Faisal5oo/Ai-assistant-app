"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronDown, Target } from "lucide-react";
import { DEEP_WORK_DURATIONS } from "@/lib/deepWorkConstants";

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {boolean} [props.isCommitting]
 * @param {(config: { taskId: string; taskTitle: string; objective: string; durationMinutes: number }) => void | Promise<void>} props.onCommit
 */
export function PreFlightCard({ tasks, isCommitting = false, onCommit }) {
  const active = tasks.filter((t) => t.status !== "Completed");
  const [taskId, setTaskId] = useState(active[0]?.id ?? "");
  const [objective, setObjective] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(90);

  const selected = tasks.find((t) => t.id === taskId);
  const canCommit = Boolean(taskId && objective.trim());

  const handleCommit = async () => {
    if (!canCommit || !selected || isCommitting) return;
    await onCommit({
      taskId,
      taskTitle: selected.title,
      objective,
      durationMinutes,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.96 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card mx-auto w-full max-w-lg border-gold/20 p-8 md:p-10"
    >
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
        <Brain size={22} />
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-charcoal">
        Pre-Flight Ritual
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/50">
        Anchor one task, one breakthrough, and one uninterrupted block before you
        enter the chamber.
      </p>

      <div className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-charcoal/40">
            Target task
          </label>
          <div className="relative">
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="input-field appearance-none pr-10"
            >
              <option value="" disabled>
                Select primary task…
              </option>
              {active.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-charcoal/40">
            <Target size={14} />
            Singular core objective
          </label>
          <input
            type="text"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="What is the single cognitive breakthrough you will achieve?"
            className="input-field"
            maxLength={200}
          />
        </div>

        <div>
          <span className="mb-3 block text-xs font-semibold uppercase tracking-widest text-charcoal/40">
            Session duration
          </span>
          <div className="flex flex-wrap gap-2">
            {DEEP_WORK_DURATIONS.map(({ minutes, label }) => {
              const selectedDuration = durationMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDurationMinutes(minutes)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    selectedDuration
                      ? "bg-gold text-charcoal shadow-soft"
                      : "border border-charcoal/10 bg-white/70 text-charcoal/70 hover:border-gold/40 hover:text-charcoal"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <motion.button
          type="button"
          disabled={!canCommit || isCommitting}
          onClick={handleCommit}
          whileHover={canCommit && !isCommitting ? { scale: 1.02 } : undefined}
          whileTap={canCommit && !isCommitting ? { scale: 0.98 } : undefined}
          className="pill-btn-gold w-full py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isCommitting ? "Committing…" : "Commit to Deep Work"}
        </motion.button>
      </div>
    </motion.div>
  );
}
