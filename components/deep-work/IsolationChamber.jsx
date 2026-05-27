"use client";

import { motion } from "framer-motion";
import { DeepWorkCountdown } from "./DeepWorkCountdown";
import { AmbientSoundscape } from "./AmbientSoundscape";

/**
 * @param {Object} props
 * @param {{ taskTitle: string; objective: string; durationMinutes: number; startedAt: number }} props.session
 * @param {() => void} props.onComplete
 * @param {() => void} props.onRequestAbandon
 */
export function IsolationChamber({ session, onComplete, onRequestAbandon }) {
  const totalSeconds = session.durationMinutes * 60;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="flex w-full max-w-3xl flex-col items-center"
    >
      <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.25em] text-gold-dark/90">
        Monastic focus mode
      </p>
      <h2 className="mb-1 text-center font-display text-lg font-medium text-charcoal/80 md:text-xl">
        {session.taskTitle}
      </h2>
      <p className="mb-10 max-w-md text-center text-sm leading-relaxed text-charcoal/45">
        {session.objective}
      </p>

      <DeepWorkCountdown
        totalSeconds={totalSeconds}
        startedAt={session.startedAt}
        onComplete={onComplete}
      />

      <div className="mt-12 w-full max-w-md">
        <AmbientSoundscape active />
      </div>

      <button
        type="button"
        onClick={onRequestAbandon}
        className="mt-10 text-sm font-medium text-charcoal/40 underline-offset-4 transition hover:text-charcoal/70 hover:underline"
      >
        Abandon session
      </button>
    </motion.div>
  );
}
