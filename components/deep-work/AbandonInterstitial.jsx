"use client";

import { motion } from "framer-motion";
import { ABANDON_PROMPT } from "@/lib/deepWorkConstants";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onStay
 * @param {() => void} props.onLeave
 */
export function AbandonInterstitial({ open, onStay, onLeave }) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/40 px-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="abandon-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card max-w-md border-gold/25 p-8 text-center shadow-soft"
      >
        <h2
          id="abandon-title"
          className="font-display text-xl font-semibold leading-snug text-charcoal"
        >
          Protect your flow state
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-charcoal/55">{ABANDON_PROMPT}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onStay} className="pill-btn-gold">
            Stay in the chamber
          </button>
          <button type="button" onClick={onLeave} className="pill-btn-ghost">
            Abandon session
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
