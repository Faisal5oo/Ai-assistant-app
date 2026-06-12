"use client";

import { motion } from "framer-motion";
import { Diamond } from "lucide-react";

/**
 * @param {Object} props
 * @param {number}  props.completed
 * @param {number}  props.goal
 * @param {boolean} [props.isRunning]
 */
export function SessionTracker({ completed, goal, isRunning }) {
  return (
    <div className="flex flex-col items-end gap-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-charcoal/38">
        Today&apos;s sessions
      </p>
      <div className="flex items-center gap-2">
        {Array.from({ length: goal }, (_, i) => {
          const done = i < completed;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.055, type: "spring", stiffness: 320 }}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border transition-all duration-500 ${
                done
                  ? "border-gold/50 bg-gold/22 text-charcoal shadow-[0_0_10px_rgba(250,204,21,0.22)]"
                  : "border-charcoal/10 bg-white/50 text-charcoal/22"
              }`}
            >
              <Diamond
                size={15}
                strokeWidth={done ? 2.5 : 1.5}
                fill={done ? "currentColor" : "none"}
              />
            </motion.div>
          );
        })}
      </div>
      <p className="text-sm text-charcoal/50">
        <span className="font-semibold text-charcoal">{completed}</span>
        <span className="text-charcoal/38"> / {goal} completed</span>
      </p>
    </div>
  );
}
