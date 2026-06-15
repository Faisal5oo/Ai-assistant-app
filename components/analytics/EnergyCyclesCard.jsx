"use client";

import { motion } from "framer-motion";
import { BatteryLow, Radio, Zap } from "lucide-react";

const CYCLE_META = [
  {
    key: "cognitiveDepletion",
    label: "Cognitive Battery Depleted",
    icon: BatteryLow,
    color: "from-amber-500/20 to-orange-400/10",
  },
  {
    key: "externalFriction",
    label: "External Friction",
    icon: Radio,
    color: "from-sky-500/15 to-blue-400/10",
  },
  {
    key: "dopaminePull",
    label: "Dopamine Pull",
    icon: Zap,
    color: "from-violet-500/15 to-purple-400/10",
  },
];

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').ProductivitySummary['deepWork']['energyCycles']} props.energyCycles
 * @param {number} [props.earlyCompletions]
 * @param {number} [props.totalMinutesSaved]
 * @param {boolean} [props.isLoading]
 */
export function EnergyCyclesCard({
  energyCycles,
  earlyCompletions = 0,
  totalMinutesSaved = 0,
  isLoading = false,
}) {
  const total = energyCycles.total || 0;

  return (
    <div className="glass-card p-6">
      <h3 className="font-display text-lg font-semibold">Deep Work Energy Cycles</h3>
      <p className="mt-1 text-sm text-charcoal/50">
        Honest session exits become calibration data — not failure metrics.
      </p>

      {isLoading ? (
        <div className="mt-6 h-32 animate-pulse rounded-2xl bg-charcoal/5" />
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {CYCLE_META.map((meta) => {
              const count = energyCycles[meta.key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const Icon = meta.icon;
              return (
                <div
                  key={meta.key}
                  className={`rounded-2xl border border-white/60 bg-gradient-to-r ${meta.color} p-4`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-charcoal">
                      <Icon size={16} className="text-charcoal/60" />
                      {meta.label}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-charcoal">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/8">
                    <motion.div
                      className="h-full rounded-full bg-gold/80"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {(earlyCompletions > 0 || totalMinutesSaved > 0) && (
            <div className="mt-5 rounded-2xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-charcoal/75">
              <span className="font-semibold text-charcoal">{earlyCompletions}</span> early
              objective{earlyCompletions === 1 ? "" : "s"} secured ·{" "}
              <span className="font-semibold text-gold-dark">{totalMinutesSaved} min</span>{" "}
              credited to recovery
            </div>
          )}
        </>
      )}
    </div>
  );
}
