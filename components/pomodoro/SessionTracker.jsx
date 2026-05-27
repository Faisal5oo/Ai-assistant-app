"use client";

import { motion } from "framer-motion";
import { Diamond } from "lucide-react";

/**
 * @param {Object} props
 * @param {number} props.completed
 * @param {number} props.goal
 */
export function SessionTracker({ completed, goal }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-charcoal/40">
        Today&apos;s pomodoros
      </p>
      <div className="flex items-center gap-3">
        {Array.from({ length: goal }, (_, i) => {
          const done = i < completed;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
                done
                  ? "border-gold/50 bg-gold/25 text-charcoal"
                  : "border-charcoal/10 bg-white/50 text-charcoal/25"
              }`}
            >
              <Diamond
                size={18}
                strokeWidth={done ? 2.5 : 1.5}
                fill={done ? "currentColor" : "none"}
              />
            </motion.div>
          );
        })}
      </div>
      <p className="text-sm text-charcoal/55">
        <span className="font-semibold text-charcoal">{completed}</span>
        <span className="text-charcoal/40"> / {goal} completed</span>
      </p>
    </div>
  );
}
