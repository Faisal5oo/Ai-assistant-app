"use client";

import { useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CornerDownLeft,
  FastForward,
} from "lucide-react";
import { BatchSprintTimer } from "./BatchSprintTimer";
import { ExecutionTaskCard } from "./ExecutionTaskCard";
import { SprintVelocityBar } from "./SprintVelocityBar";

/**
 * @param {Object} props
 * @param {import('@/lib/batchingConstants').typeof import('@/lib/batchingConstants').BATCH_BUCKETS[number]} props.bucket
 * @param {import('@/types/interfaces').Task | null} props.currentTask
 * @param {number} props.currentIndex
 * @param {number} props.total
 * @param {number | null} props.sprintStartedAt
 * @param {import('@/hooks/useBatchingSession').CardExitMode} props.cardExitMode
 * @param {() => void} props.onComplete
 * @param {() => void} props.onDefer
 * @param {() => void} props.onSkipToEnd
 * @param {(elapsedMs: number) => void} props.onSessionTimerEnd
 * @param {() => void} props.onExit
 */
export function ImmersiveSprintCanvas({
  bucket,
  currentTask,
  currentIndex,
  total,
  sprintStartedAt,
  cardExitMode,
  onComplete,
  onDefer,
  onSkipToEnd,
  onSessionTimerEnd,
  onExit,
}) {
  const handleSessionEnd = useCallback(
    (ms) => {
      onSessionTimerEnd(ms);
    },
    [onSessionTimerEnd]
  );

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const BucketIcon = bucket.Icon;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${bucket.title} batch sprint`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[120] flex flex-col bg-gradient-to-b from-cream-50 via-cream-100 to-cream-200"
    >
      <SprintVelocityBar
        currentIndex={currentIndex}
        total={total}
        taskId={currentTask?.id ?? null}
        timerActive={Boolean(currentTask) && !cardExitMode}
      />

      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-8 pt-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={onExit}
            className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/45 transition hover:text-charcoal"
          >
            <ArrowLeft size={16} />
            Exit sprint
          </button>
          <div className="hidden sm:block">
            <BatchSprintTimer
              startedAt={sprintStartedAt}
              active={Boolean(currentTask)}
              onSessionEnd={handleSessionEnd}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="mx-auto mt-6 flex max-w-2xl items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
            <BucketIcon size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Immersive sprint deck
            </p>
            <h2 className="font-display text-lg font-semibold text-charcoal">
              {bucket.title}
            </h2>
          </div>
        </motion.div>

        <div className="relative mx-auto mt-10 flex flex-1 w-full max-w-lg items-center justify-center">
          <AnimatePresence mode="wait">
            {currentTask && (
              <ExecutionTaskCard
                key={currentTask.id}
                task={currentTask}
                exitMode={cardExitMode}
              />
            )}
          </AnimatePresence>
          {!currentTask && (
            <p className="text-sm text-charcoal/40">Preparing next card…</p>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mt-8 flex w-full max-w-lg flex-col items-center gap-4"
        >
          <button
            type="button"
            onClick={onComplete}
            disabled={!currentTask || Boolean(cardExitMode)}
            className="group flex w-full max-w-sm items-center justify-center gap-3 rounded-full border-2 border-gold bg-gold/20 px-8 py-4 transition hover:bg-gold/35 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gold-dark bg-gold text-charcoal shadow-glass transition group-hover:scale-105">
              <Check size={20} strokeWidth={2.5} />
            </span>
            <span className="font-display text-sm font-semibold text-charcoal">
              Complete &amp; archive
            </span>
          </button>

          <button
            type="button"
            onClick={onDefer}
            disabled={!currentTask || Boolean(cardExitMode) || total <= 1}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-2.5 text-sm font-medium text-charcoal/60 shadow-glass transition hover:bg-white hover:text-charcoal disabled:opacity-40"
          >
            <CornerDownLeft size={16} className="rotate-[-90deg]" />
            Skip / defer to bottom
          </button>

          <button
            type="button"
            onClick={onSkipToEnd}
            className="inline-flex items-center gap-2 text-xs font-medium text-charcoal/40 transition hover:text-charcoal/60"
          >
            <FastForward size={14} />
            End entire batch early
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
