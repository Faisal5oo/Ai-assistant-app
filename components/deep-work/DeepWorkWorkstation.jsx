"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Brain } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useProductivitySummary } from "@/hooks/queries/useProductivitySummaryQuery";
import { useDeepWorkSession } from "@/hooks/useDeepWorkSession";
import { useDeepWorkTabIntercept } from "@/hooks/useDeepWorkTabIntercept";
import { playDeepWorkSuccessChime } from "@/lib/deepWorkAudio";
import { PreFlightCard } from "./PreFlightCard";
import { IsolationChamber } from "./IsolationChamber";
import { DistractionLog } from "./DistractionLog";
import { SessionRecap } from "./SessionRecap";
import { FrictionGateModal } from "./FrictionGateModal";
import { DeepWorkReturnDialog } from "./DeepWorkReturnDialog";
import { DeepWorkVictoryBurst } from "./DeepWorkVictoryBurst";
import { EarlyVictoryFluidBurst } from "./EarlyVictoryFluidBurst";
import { EarlyVictoryOverlay } from "./EarlyVictoryOverlay";

export function DeepWorkWorkstation() {
  const { tasks } = useTasks();
  const { refetch: refetchSummary } = useProductivitySummary();
  const setDeepWorkFocusMode = useTaskStore((s) => s.setDeepWorkFocusMode);

  const {
    phase,
    session,
    distractions,
    showFrictionGate,
    isCommitting,
    isResolving,
    isAbandoning,
    isClaimingEarly,
    celebratingComplete,
    showEarlyCelebration,
    earlyVictory,
    commitSession,
    activateTimer,
    completeSession,
    resolveSession,
    markTaskComplete,
    finishTaskCelebration,
    requestAbandon,
    cancelFrictionGate,
    confirmFrictionAbandon,
    claimEarlyObjective,
    dismissEarlyVictory,
    addDistraction,
    dismissRecap,
  } = useDeepWorkSession();

  const tabInterceptEnabled =
    phase === "active" && Boolean(session?.timerRunning) && !session?.timerFrozen;
  const { showReturnDialog, resumeFocus, declareResearchPivot } =
    useDeepWorkTabIntercept({ enabled: tabInterceptEnabled });

  useEffect(() => {
    return () => setDeepWorkFocusMode(false);
  }, [setDeepWorkFocusMode]);

  const handleCommit = useCallback(
    async (config) => {
      await commitSession(config);
    },
    [commitSession]
  );

  const handleTimerComplete = useCallback(() => {
    if (session?.timerFrozen) return;
    playDeepWorkSuccessChime();
    completeSession();
  }, [completeSession, session?.timerFrozen]);

  const handleResolve = useCallback(
    async (achieved) => {
      await resolveSession(achieved);
      refetchSummary();
    },
    [resolveSession, refetchSummary]
  );

  const handleMarkComplete = useCallback(() => {
    markTaskComplete();
  }, [markTaskComplete]);

  const handleEarlyObjective = useCallback(async () => {
    playDeepWorkSuccessChime();
    await claimEarlyObjective();
    refetchSummary();
  }, [claimEarlyObjective, refetchSummary]);

  const handleFrictionAbandon = useCallback(
    async (reason) => {
      await confirmFrictionAbandon(reason);
      refetchSummary();
    },
    [confirmFrictionAbandon, refetchSummary]
  );

  useEffect(() => {
    if (!celebratingComplete) return undefined;
    const timer = setTimeout(() => {
      finishTaskCelebration();
    }, 1100);
    return () => clearTimeout(timer);
  }, [celebratingComplete, finishTaskCelebration]);

  const isActive = phase === "active" && !earlyVictory;
  const showPeripheral = !isActive && !earlyVictory;

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <EarlyVictoryFluidBurst active={showEarlyCelebration} />
      <DeepWorkVictoryBurst active={celebratingComplete} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10"
      >
        <AnimatePresence>
          {showPeripheral && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link
                href="/productivity"
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/50 transition hover:text-charcoal"
              >
                <ArrowLeft size={16} />
                Productivity hub
              </Link>

              {phase === "setup" && (
                <div className="mb-10 max-w-2xl">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">
                    <Brain size={24} />
                  </div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal md:text-4xl">
                    Deep Work
                  </h1>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/50">
                    Eliminate context switching, offload cognitive residue, and
                    commit to one breakthrough before the chamber opens.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`grid gap-8 ${
            isActive
              ? "lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]"
              : "grid-cols-1"
          }`}
        >
          <div className="flex justify-center">
            <AnimatePresence mode="wait">
              {phase === "setup" && (
                <PreFlightCard
                  key="preflight"
                  tasks={tasks}
                  isCommitting={isCommitting}
                  onCommit={handleCommit}
                />
              )}
              {phase === "active" && session && !earlyVictory && (
                <IsolationChamber
                  key="chamber"
                  session={session}
                  onComplete={handleTimerComplete}
                  onRequestAbandon={requestAbandon}
                  onActivateTimer={activateTimer}
                  onEarlyObjective={handleEarlyObjective}
                  isClaimingEarly={isClaimingEarly}
                />
              )}
              {phase === "recap" && session && (
                <SessionRecap
                  key="recap"
                  session={session}
                  isResolving={isResolving}
                  celebratingComplete={celebratingComplete}
                  onResolve={handleResolve}
                  onMarkTaskComplete={handleMarkComplete}
                  onDismiss={dismissRecap}
                />
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <DistractionLog items={distractions} onCapture={addDistraction} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showFrictionGate && (
          <FrictionGateModal
            key="friction-gate"
            open={showFrictionGate}
            isSubmitting={isAbandoning}
            onStay={cancelFrictionGate}
            onSelectReason={handleFrictionAbandon}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReturnDialog && (
          <DeepWorkReturnDialog
            key="return-dialog"
            onResumeFocus={resumeFocus}
            onResearchPivot={declareResearchPivot}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {earlyVictory && (
          <EarlyVictoryOverlay
            key="early-victory"
            minutesSaved={earlyVictory.minutesSaved}
            onContinue={dismissEarlyVictory}
          />
        )}
      </AnimatePresence>

      {isActive && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-0 bg-gradient-to-b from-cream-50/0 via-cream-100/40 to-cream-200/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}
    </div>
  );
}
