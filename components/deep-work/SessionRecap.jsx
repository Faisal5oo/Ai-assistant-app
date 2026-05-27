"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Clock } from "lucide-react";

/**
 * @param {Object} props
 * @param {{ taskTitle: string; objective: string; durationMinutes: number }} props.session
 * @param {() => void} props.onLogTime
 * @param {() => void} props.onDismiss
 */
export function SessionRecap({ session, onLogTime, onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card mx-auto w-full max-w-lg border-gold/25 p-8 md:p-10"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal">
        <CheckCircle2 size={26} />
      </div>
      <h2 className="font-display text-2xl font-semibold text-charcoal">
        Session complete
      </h2>
      <p className="mt-2 text-sm text-charcoal/50">
        You protected your attention. Log this block to your task ledger.
      </p>

      <dl className="mt-8 space-y-4 rounded-3xl bg-cream-100/80 p-5">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-charcoal/40">
            Task
          </dt>
          <dd className="mt-1 font-medium text-charcoal">{session.taskTitle}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-widest text-charcoal/40">
            Core objective
          </dt>
          <dd className="mt-1 text-sm leading-relaxed text-charcoal/75">
            {session.objective}
          </dd>
        </div>
        <div className="flex items-center gap-2 text-sm text-charcoal/60">
          <Clock size={16} className="text-gold-dark" />
          <span>{session.durationMinutes} minutes of monastic focus</span>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onLogTime} className="pill-btn-gold flex-1">
          Log time to task
        </button>
        <button type="button" onClick={onDismiss} className="pill-btn-ghost flex-1">
          Start another session
        </button>
      </div>
    </motion.div>
  );
}
