"use client";

import { motion } from "framer-motion";
import { BatteryLow, Radio, Zap } from "lucide-react";
import {
  FRICTION_GATE_BODY,
  FRICTION_GATE_HEADLINE,
  FRICTION_GATE_OPTIONS,
} from "@/lib/deepWorkConstants";

const ICONS = {
  cognitive_depletion: BatteryLow,
  external_friction: Radio,
  dopamine_pull: Zap,
};

/**
 * Supportive friction gate — calibrates energy before session exit.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {boolean} [props.isSubmitting]
 * @param {() => void} props.onStay
 * @param {(reason: import('@/lib/deepWorkConstants').DeepWorkAbandonReason) => void} props.onSelectReason
 */
export function FrictionGateModal({ open, isSubmitting = false, onStay, onSelectReason }) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[105] flex items-center justify-center bg-charcoal/50 px-5 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="friction-gate-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-gold/20 bg-gradient-to-br from-charcoal/95 via-[#1a1814]/92 to-charcoal/98 p-8 shadow-[0_32px_90px_rgba(0,0,0,0.45)] md:p-10"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-tr from-gold/10 via-transparent to-amber-200/5"
        />

        <div className="relative z-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/70">
            Energy calibration
          </p>
          <h2
            id="friction-gate-title"
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-cream-50"
          >
            {FRICTION_GATE_HEADLINE}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            {FRICTION_GATE_BODY}
          </p>

          <div className="mt-8 space-y-3">
            {FRICTION_GATE_OPTIONS.map((option, index) => {
              const Icon = ICONS[option.id];
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  disabled={isSubmitting}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.4 }}
                  onClick={() => onSelectReason(option.id)}
                  className="group flex w-full items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-gold/35 hover:bg-gold/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold transition group-hover:bg-gold/20">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-cream-50">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-white/45">
                      {option.description}
                    </span>
                  </span>
                </motion.button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onStay}
            className="mt-8 w-full rounded-full border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-white/80 transition hover:border-gold/30 hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            Return to focus
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
