"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {string}  props.prompt
 * @param {boolean} [props.isRunning]
 */
export function BreakGuideCard({ visible, prompt, isRunning }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="glass-card mx-auto mt-6 flex max-w-md items-start gap-3 border-gold/18 p-4"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gold/22 text-charcoal">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-charcoal/38">
              Active Recovery
            </p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/68">
              {prompt}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
