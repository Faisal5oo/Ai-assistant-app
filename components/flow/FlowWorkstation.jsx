"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Zap } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useFlowSession } from "@/hooks/useFlowSession";
import { playFlowSessionChime } from "@/lib/flowAudio";
import { FLOW_LAYOUT_TRANSITION } from "@/lib/flowConstants";
import { LaunchControlPanel } from "./LaunchControlPanel";
import { FlowVoidCanvas } from "./FlowVoidCanvas";
import { MindDumpSandbox } from "./MindDumpSandbox";
import { ActiveRecovery } from "./ActiveRecovery";

export function FlowWorkstation() {
  const { tasks } = useTasks();
  const batchingFilterTag = useTaskStore((s) => s.batchingFilterTag);
  const setFlowFocusMode = useTaskStore((s) => s.setFlowFocusMode);

  const {
    phase,
    session,
    parkedThoughts,
    igniteFlow,
    completeFlowSession,
    finishRecovery,
    exitAfterRecovery,
    parkDistraction,
    removeParkedThought,
  } = useFlowSession();

  useEffect(() => {
    return () => setFlowFocusMode(false);
  }, [setFlowFocusMode]);

  const handleIgnite = useCallback(
    (config) => {
      igniteFlow(config);
    },
    [igniteFlow]
  );

  const handleTimerComplete = useCallback(() => {
    playFlowSessionChime();
    completeFlowSession();
  }, [completeFlowSession]);

  const isImmersive = phase === "active" || phase === "recovery";

  return (
    <div
      className={`relative ${
        isImmersive ? "min-h-screen" : "min-h-[calc(100vh-8rem)]"
      }`}
    >
      <AnimatePresence mode="wait">
        {phase === "setup" && (
          <motion.div
            key="setup-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FLOW_LAYOUT_TRANSITION}
            className="relative z-10"
          >
            <Link
              href="/productivity"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-charcoal/50 transition hover:text-charcoal"
            >
              <ArrowLeft size={16} />
              Productivity hub
            </Link>

            <div className="mb-10 max-w-2xl">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">
                <Zap size={24} />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-wide text-charcoal md:text-4xl">
                Flow State Engine
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed tracking-wide text-charcoal/50">
                Enter calibrated monastic focus — isolate cognition, park
                distractions, and recover deliberately before returning to work.
              </p>
            </div>

            <AnimatePresence mode="wait">
              <LaunchControlPanel
                key="launch"
                tasks={tasks}
                batchingFilterTag={batchingFilterTag}
                onIgnite={handleIgnite}
              />
            </AnimatePresence>
          </motion.div>
        )}

        {phase === "active" && session && (
          <motion.div key="void" layout transition={FLOW_LAYOUT_TRANSITION}>
            <FlowVoidCanvas session={session} onComplete={handleTimerComplete} />
            <MindDumpSandbox
              items={parkedThoughts}
              onPark={parkDistraction}
              onRemove={removeParkedThought}
            />
          </motion.div>
        )}

        {phase === "recovery" && (
          <motion.div
            key="recovery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={FLOW_LAYOUT_TRANSITION}
            className="fixed inset-0 z-50 bg-cream-50"
          >
            <ActiveRecovery
              onRecoveryComplete={finishRecovery}
              onExit={exitAfterRecovery}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
