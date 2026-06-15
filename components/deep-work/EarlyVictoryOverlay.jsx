"use client";

import { motion } from "framer-motion";
import { Clock, Sparkles, Trophy } from "lucide-react";

/**
 * @param {Object} props
 * @param {number} props.minutesSaved
 * @param {() => void} props.onContinue
 */
export function EarlyVictoryOverlay({ minutesSaved, onContinue }) {
  const minuteLabel = minutesSaved === 1 ? "minute" : "minutes";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[115] flex items-center justify-center bg-charcoal/60 px-6 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="early-victory-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-charcoal/95 via-[#1c1a16]/90 to-charcoal p-8 shadow-[0_28px_80px_rgba(0,0,0,0.5)] md:p-10"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-gold/20 blur-3xl"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/35 bg-gold/15 text-gold">
            <Trophy size={28} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/75">
            Early objective secured
          </p>
          <h2
            id="early-victory-title"
            className="mt-3 font-display text-2xl font-semibold tracking-tight text-cream-50"
          >
            Elite efficiency
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            You beat the clock by{" "}
            <span className="font-semibold text-gold">
              {minutesSaved} {minuteLabel}
            </span>
            . This time has been credited to your upcoming recovery rest break.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50">
            <Clock size={14} className="text-gold" />
            <span>Performance logged · Task marked complete</span>
          </div>

          <button
            type="button"
            onClick={onContinue}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-gold via-amber-300 to-gold py-3.5 text-sm font-bold tracking-wide text-charcoal shadow-[0_0_28px_rgba(250,204,21,0.35)] transition hover:shadow-[0_0_36px_rgba(250,204,21,0.48)]"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles size={16} />
              Continue
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
