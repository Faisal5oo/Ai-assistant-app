"use client";

import { motion } from "framer-motion";
import { EISENHOWER_SPRING } from "@/lib/eisenhower";

/**
 * @param {Object} props
 * @param {number} props.progress - 0..1
 * @param {number} props.count
 * @param {number} props.goal
 */
export function WeeklyCommitmentMeter({ progress, count, goal }) {
  const pct = Math.round(progress * 100);

  return (
    <div className="mb-3 rounded-2xl border border-white/50 bg-white/40 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
          Weekly commitment
        </span>
        <span className="text-[11px] font-medium tabular-nums text-charcoal/55">
          {count}/{goal}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/[0.08]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold/80 to-gold"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={EISENHOWER_SPRING}
        />
      </div>
    </div>
  );
}
