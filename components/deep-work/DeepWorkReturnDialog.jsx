"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

/**
 * Premium co-pilot check-in when the user returns to an active deep work tab.
 * @param {Object} props
 * @param {() => void} props.onResumeFocus
 * @param {() => void} props.onResearchPivot
 */
export function DeepWorkReturnDialog({ onResumeFocus, onResearchPivot }) {
  const userName = useTaskStore((s) => s.userName);
  const greeting = userName?.trim() ? userName.trim() : "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-charcoal/55 px-6 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deep-work-return-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-lg overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-charcoal/92 via-[#1c1a16]/88 to-charcoal/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-10"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-gold/15 via-transparent to-amber-300/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gold/20 blur-3xl"
          animate={{ opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative z-10">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/30 bg-gold/15 text-gold">
            <Sparkles size={20} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-gold/70">
            Co-pilot check-in
          </p>
          <h2
            id="deep-work-return-title"
            className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight text-cream-50 md:text-2xl"
          >
            Welcome back, {greeting}.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/60">
            The workspace is still running. Did you step out for research, or did
            the logic get demanding? I&apos;m here to protect your momentum — not
            police it.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={onResumeFocus}
              className="rounded-full bg-gradient-to-r from-gold via-amber-300 to-gold px-6 py-3.5 text-sm font-bold tracking-wide text-charcoal shadow-[0_0_28px_rgba(250,204,21,0.35)] transition hover:shadow-[0_0_36px_rgba(250,204,21,0.48)]"
            >
              [ I&apos;m Resuming Focus ]
            </button>
            <button
              type="button"
              onClick={onResearchPivot}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/80 transition hover:border-gold/35 hover:bg-white/10 hover:text-white"
            >
              [ Declaring a Research Pivot ]
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
