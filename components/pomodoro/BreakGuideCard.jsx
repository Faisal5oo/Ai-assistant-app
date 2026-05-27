"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {string} props.prompt
 */
export function BreakGuideCard({ visible, prompt }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="glass-card mx-auto mt-6 flex max-w-md items-start gap-3 border-gold/20 p-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/40">
              Active recovery
            </p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/75">
              {prompt}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
