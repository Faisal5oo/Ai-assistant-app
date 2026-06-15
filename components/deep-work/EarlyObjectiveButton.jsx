"use client";

import { motion } from "framer-motion";
import { Target } from "lucide-react";

/**
 * @param {Object} props
 * @param {() => void} props.onClaim
 * @param {boolean} [props.disabled]
 */
export function EarlyObjectiveButton({ onClaim, disabled = false }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClaim}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className="group relative mt-8 w-full max-w-md overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-charcoal via-[#1f1d18] to-charcoal px-6 py-4 shadow-[0_8px_32px_rgba(250,204,21,0.18)] transition hover:border-gold/50 hover:shadow-[0_12px_40px_rgba(250,204,21,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-gold/20 to-transparent"
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex items-center justify-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold transition group-hover:bg-gold/30">
          <Target size={20} strokeWidth={2.25} />
        </span>
        <span className="text-left">
          <span className="block text-sm font-bold tracking-wide text-gold">
            Objective Achieved
          </span>
          <span className="block text-[11px] font-medium text-white/50">
            I finished my breakthrough ahead of schedule
          </span>
        </span>
      </span>
    </motion.button>
  );
}
