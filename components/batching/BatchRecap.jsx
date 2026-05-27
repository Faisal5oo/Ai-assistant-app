"use client";

import { motion } from "framer-motion";
import { Sparkles, Timer, Trophy, Zap } from "lucide-react";
import { formatMsToHoursMinutes } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {{ totalMs: number; tasksCrushed: number; skipped: number; focusEfficiency: number; bucketTitle: string }} props.stats
 * @param {() => void} props.onExit
 */
export function BatchRecap({ stats, onExit }) {
  const durationLabel =
    stats.totalMs > 0
      ? formatMsToHoursMinutes(stats.totalMs)
      : "Under a minute";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card mx-auto w-full max-w-lg border-gold/25 p-8 md:p-10"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal">
        <Sparkles size={26} />
      </div>
      <h2 className="font-display text-2xl font-semibold text-charcoal">
        Batch crushed
      </h2>
      <p className="mt-2 text-sm text-charcoal/50">
        Your {stats.bucketTitle} sprint is complete. Here is how you performed.
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <MetricTile
          icon={<Timer size={18} className="text-gold-dark" />}
          label="Batch time"
          value={durationLabel}
        />
        <MetricTile
          icon={<Trophy size={18} className="text-gold-dark" />}
          label="Tasks crushed"
          value={String(stats.tasksCrushed)}
        />
        <MetricTile
          icon={<Zap size={18} className="text-gold-dark" />}
          label="Focus efficiency"
          value={`${stats.focusEfficiency}%`}
        />
      </dl>

      {stats.skipped > 0 && (
        <p className="mt-4 rounded-2xl bg-cream-100/80 px-4 py-3 text-center text-xs text-charcoal/50">
          {stats.skipped} task{stats.skipped === 1 ? "" : "s"} skipped at end of batch
        </p>
      )}

      <button type="button" onClick={onExit} className="pill-btn-gold mt-8 w-full">
        Back to batch manager
      </button>
    </motion.div>
  );
}

/**
 * @param {Object} props
 * @param {import('react').ReactNode} props.icon
 * @param {string} props.label
 * @param {string} props.value
 */
function MetricTile({ icon, label, value }) {
  return (
    <div className="rounded-3xl bg-cream-100/80 p-4 text-center">
      <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-glass">
        {icon}
      </div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/40">
        {label}
      </dt>
      <dd className="mt-1 font-display text-lg font-semibold text-charcoal">{value}</dd>
    </div>
  );
}
