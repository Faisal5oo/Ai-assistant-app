"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield } from "lucide-react";

/**
 * @param {Object} props
 * @param {string[]} props.items
 * @param {(text: string) => void} props.onCapture
 */
export function DistractionLog({ items, onCapture }) {
  const [draft, setDraft] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onCapture(draft);
    setDraft("");
  };

  return (
    <aside className="flex w-full flex-col lg:max-w-xs">
      <div className="sticky top-8 rounded-3xl border border-white/70 bg-white/45 p-5 shadow-glass backdrop-blur-glass">
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-charcoal/40">
          <Shield size={14} className="text-gold-dark" />
          The Shield
        </div>
        <label
          htmlFor="distraction-capture"
          className="mb-2 block text-sm font-medium text-charcoal"
        >
          Clear Your Mind
        </label>
        <form onSubmit={handleSubmit}>
          <input
            id="distraction-capture"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Capture the urge, return to focus…"
            className="input-field text-sm"
            autoComplete="off"
          />
        </form>
        <p className="mt-2 text-[11px] text-charcoal/40">Press Enter to park the thought.</p>

        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.li
                key={`${item}-${index}`}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="rounded-2xl border border-charcoal/5 bg-cream-50/80 px-3 py-2 text-sm text-charcoal/70"
              >
                {item}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {items.length === 0 && (
          <p className="mt-3 text-xs italic text-charcoal/35">
            Unrelated thoughts land here — your task stays sacred.
          </p>
        )}
      </div>
    </aside>
  );
}
