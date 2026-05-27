"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain } from "lucide-react";

const FADE_MS = 5000;

/**
 * @param {Object} props
 * @param {{ id: string; text: string; createdAt: number }[]} props.items
 * @param {(text: string) => void} props.onPark
 * @param {(id: string) => void} props.onRemove
 */
export function MindDumpSandbox({ items, onPark, onRemove }) {
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const timers = items.map((item) =>
      setTimeout(() => onRemove(item.id), FADE_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [items, onRemove]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onPark(draft);
    setDraft("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-[55] w-full max-w-xs">
      <div className="rounded-3xl border border-white/70 bg-white/50 p-4 shadow-glass backdrop-blur-glass">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-charcoal/40">
          <Brain size={12} className="text-gold-dark" />
          Cognitive Shield
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Park a Distraction"
            className="input-field text-sm tracking-wide"
            autoComplete="off"
            aria-label="Park a distraction"
          />
        </form>

        <ul className="mt-3 max-h-32 space-y-1.5 overflow-hidden">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 0.55, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl border border-charcoal/5 bg-cream-50/60 px-3 py-2 text-xs tracking-wide text-charcoal/55"
              >
                {item.text}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
