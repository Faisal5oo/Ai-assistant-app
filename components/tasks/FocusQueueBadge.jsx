"use client";

import { motion } from "framer-motion";

/**
 * @param {Object} props
 * @param {"paused" | "queued"} props.variant
 * @param {"light" | "dark"} [props.theme]
 */
export function FocusQueueBadge({ variant, theme = "light" }) {
  const label = variant === "paused" ? "Paused" : "In queue";

  const styles =
    theme === "dark"
      ? variant === "paused"
        ? "bg-white/10 text-white/60 ring-white/15"
        : "bg-white/[0.06] text-white/45 ring-white/10"
      : variant === "paused"
        ? "bg-gold/15 text-charcoal/70 ring-gold/25"
        : "bg-charcoal/[0.06] text-charcoal/45 ring-charcoal/10";

  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles}`}
    >
      {label}
    </motion.span>
  );
}
