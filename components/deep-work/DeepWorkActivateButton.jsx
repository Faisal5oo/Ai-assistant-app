"use client";

import { motion } from "framer-motion";
import { Play } from "lucide-react";

/**
 * Premium manual activation — timer only starts on explicit desk-ready click.
 * @param {Object} props
 * @param {() => void} props.onActivate
 * @param {boolean} [props.disabled]
 */
export function DeepWorkActivateButton({ onActivate, disabled = false }) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onActivate}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className="relative mt-8 inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-gold via-amber-300 to-gold px-8 py-4 text-base font-bold tracking-wide text-charcoal shadow-[0_0_32px_rgba(250,204,21,0.5)] transition hover:shadow-[0_0_42px_rgba(250,204,21,0.62)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
        animate={{ x: ["-120%", "120%"] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <Play size={20} fill="currentColor" className="relative z-10 shrink-0" />
      <span className="relative z-10">I&apos;m at my desk — begin focus</span>
    </motion.button>
  );
}
