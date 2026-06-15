"use client";

import { motion } from "framer-motion";
import { DeepWorkCountdown } from "./DeepWorkCountdown";
import { DeepWorkActivateButton } from "./DeepWorkActivateButton";
import { EarlyObjectiveButton } from "./EarlyObjectiveButton";
import { AmbientSoundscape } from "./AmbientSoundscape";
import { computeDeepWorkRemainingSeconds } from "@/lib/deepWorkSessionStorage";

/**
 * @param {Object} props
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} props.session
 * @param {() => void} props.onComplete
 * @param {() => void} props.onRequestAbandon
 * @param {() => void} props.onActivateTimer
 * @param {() => void} props.onEarlyObjective
 * @param {boolean} [props.isClaimingEarly]
 */
export function IsolationChamber({
  session,
  onComplete,
  onRequestAbandon,
  onActivateTimer,
  onEarlyObjective,
  isClaimingEarly = false,
}) {
  const totalSeconds = session.durationMinutes * 60;
  const awaitingActivation = !session.timerRunning;
  const isFrozen = Boolean(session.timerFrozen);
  const frozenRemaining = isFrozen
    ? computeDeepWorkRemainingSeconds(session)
    : null;

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
        isRunning={session.timerRunning}
        isFrozen={isFrozen}
        endsAt={session.endsAt}
        frozenRemainingSeconds={frozenRemaining}
        onComplete={onComplete}
      />

      {awaitingActivation ? (
        <>
          <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-charcoal/40">
            Your block is armed. Verify you are at your desk before the countdown
            begins — it will not start automatically.
          </p>
          <DeepWorkActivateButton onActivate={onActivateTimer} />
        </>
      ) : isFrozen ? (
        <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-gold-dark/80">
          Objective secured — timer frozen
        </p>
      ) : (
        <>
          <p className="mt-6 text-center text-xs font-medium uppercase tracking-[0.2em] text-gold-dark/70">
            Deep focus in progress
          </p>
          <EarlyObjectiveButton
            onClaim={onEarlyObjective}
            disabled={isClaimingEarly}
          />
        </>
      )}

      <div className="mt-12 w-full max-w-md">
        <AmbientSoundscape active={session.timerRunning && !isFrozen} />
      </div>

      {!isFrozen && (
        <button
          type="button"
          onClick={onRequestAbandon}
          className="mt-10 text-sm font-medium text-charcoal/40 underline-offset-4 transition hover:text-charcoal/70 hover:underline"
        >
          Step out of session
        </button>
      )}
    </motion.div>
  );
}
