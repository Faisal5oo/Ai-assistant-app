"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Brain } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useDeepWorkSession } from "@/hooks/useDeepWorkSession";
import { playDeepWorkSuccessChime } from "@/lib/deepWorkAudio";
import { PreFlightCard } from "./PreFlightCard";
import { IsolationChamber } from "./IsolationChamber";
import { DistractionLog } from "./DistractionLog";
import { SessionRecap } from "./SessionRecap";
import { AbandonInterstitial } from "./AbandonInterstitial";

export function DeepWorkWorkstation() {
  const tasks = useTaskStore((s) => s.tasks);
  const setDeepWorkFocusMode = useTaskStore((s) => s.setDeepWorkFocusMode);

  const {
    phase,
    session,
    distractions,
    showAbandonPrompt,
    commitSession,
    completeSession,
    requestAbandon,
    cancelAbandon,
    confirmAbandon,
    logSessionToStore,
    addDistraction,
    resetToSetup,
  } = useDeepWorkSession();

  useEffect(() => {
    return () => setDeepWorkFocusMode(false);
  }, [setDeepWorkFocusMode]);

  const handleCommit = useCallback(
    (config) => {
      commitSession(config);
    },
    [commitSession]
  );

  const handleTimerComplete = useCallback(() => {
    playDeepWorkSuccessChime();
    completeSession();
  }, [completeSession]);

  const isActive = phase === "active";
  const showPeripheral = !isActive;

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
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
                <PreFlightCard key="preflight" tasks={tasks} onCommit={handleCommit} />
              )}
              {phase === "active" && session && (
                <IsolationChamber
                  key="chamber"
                  session={session}
                  onComplete={handleTimerComplete}
                  onRequestAbandon={requestAbandon}
                />
              )}
              {phase === "complete" && session && (
                <SessionRecap
                  key="recap"
                  session={session}
                  onLogTime={logSessionToStore}
                  onDismiss={resetToSetup}
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

      <AbandonInterstitial
        open={showAbandonPrompt}
        onStay={cancelAbandon}
        onLeave={confirmAbandon}
      />

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
