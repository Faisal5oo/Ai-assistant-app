"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

/**
 * @param {Object} props
 * @param {() => void} props.onCreate
 * @param {number} props.index
 */
export function CreateBatchCard({ onCreate, index }) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onCreate}
      className="batch-drop-zone glass-card group flex min-h-[280px] flex-col items-center justify-center gap-4 border-dashed border-charcoal/12 bg-gradient-to-br from-cream-50/80 to-white/50 p-6 text-center transition hover:border-gold/35 hover:bg-white/65 hover:shadow-glass"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-charcoal/40 shadow-glass transition group-hover:scale-105 group-hover:bg-gold/25 group-hover:text-charcoal">
        <Plus size={28} strokeWidth={1.5} />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-charcoal">
          Create New Batch
        </p>
        <p className="mt-1 max-w-[12rem] text-xs leading-relaxed text-charcoal/45">
          Add a custom cluster for your own workflow
        </p>
      </div>
    </motion.button>
  );
}
