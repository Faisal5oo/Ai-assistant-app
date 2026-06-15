"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Target, XCircle } from "lucide-react";
import { computeDeepWorkElapsedMinutes } from "@/lib/deepWorkSessionStorage";

/**
 * Premium objective confirmation overlay after a deep work block ends.
 * @param {Object} props
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} props.session
 * @param {boolean} props.isResolving
 * @param {boolean} props.celebratingComplete
 * @param {(achieved: boolean) => Promise<void>} props.onResolve
 * @param {() => void} props.onMarkTaskComplete
 * @param {() => void} props.onDismiss
 */
export function SessionRecap({
  session,
  isResolving,
  celebratingComplete,
  onResolve,
  onMarkTaskComplete,
  onDismiss,
}) {
  const [resolved, setResolved] = useState(false);
  const elapsedMinutes = session.timerRunning
    ? session.endsAt && Date.now() >= session.endsAt
      ? session.durationMinutes
      : computeDeepWorkElapsedMinutes(session)
    : 0;

  const handleResolve = async (achieved) => {
    if (resolved || isResolving) return;
    setResolved(true);
    await onResolve(achieved);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card relative mx-auto w-full max-w-lg overflow-hidden border-gold/25 p-8 md:p-10"
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal">
        <Target size={26} />
      </div>
      <h2 className="font-display text-2xl font-semibold text-charcoal">
        Did you achieve your breakthrough?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/50">
        Session time is logged separately from task completion. Confirm whether
        your singular core objective was realized.
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
          <span>
            {elapsedMinutes > 0
              ? `${elapsedMinutes} minutes of focused execution`
              : `${session.durationMinutes} minute block committed`}
          </span>
        </div>
      </dl>

      {!resolved ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={isResolving}
            onClick={() => handleResolve(true)}
            className="pill-btn-gold flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            Yes — objective achieved
          </button>
          <button
            type="button"
            disabled={isResolving}
            onClick={() => handleResolve(false)}
            className="pill-btn-ghost flex flex-1 items-center justify-center gap-2 disabled:opacity-50"
          >
            <XCircle size={18} />
            Not this time
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <p className="text-center text-sm font-medium text-charcoal/60">
            Focus metrics saved to your dashboard.
          </p>
          <button
            type="button"
            disabled={celebratingComplete}
            onClick={onMarkTaskComplete}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-charcoal text-sm font-semibold text-white shadow-soft transition hover:bg-charcoal/90 disabled:opacity-50"
          >
            <CheckCircle2 size={18} />
            Mark task complete
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="pill-btn-ghost w-full"
          >
            Start another session
          </button>
        </div>
      )}
    </motion.div>
  );
}
