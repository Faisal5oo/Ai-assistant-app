"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { formatHourRangeLabel } from "@/lib/timeBlocking";

/**
 * @param {Object} props
 * @param {{ hour: number, slotUsed: number, nextHour: number | null } | null} props.warning
 * @param {() => void} props.onDismiss
 */
export function SlotCapacityWarning({ warning, onDismiss }) {
  return (
    <AnimatePresence>
      {warning && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="mb-4 flex items-start gap-3 rounded-3xl border border-amber-300/50 bg-gradient-to-r from-amber-50/95 to-gold/10 px-4 py-3 shadow-soft"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
            <AlertCircle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight text-charcoal">
              {formatHourRangeLabel(warning.hour)} is over capacity
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-charcoal/55">
              {warning.slotUsed}/60 minutes are already blocked.{" "}
              {warning.nextHour != null
                ? `Move the exceeding task to ${formatHourRangeLabel(warning.nextHour)}.`
                : "Free up space in another hour on the runway."}
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-charcoal/45 transition hover:bg-charcoal/5 hover:text-charcoal"
          >
            Dismiss
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
