"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Boxes } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useBatchingSession } from "@/hooks/useBatchingSession";
import { BatchManager } from "./BatchManager";
import { ImmersiveSprintCanvas } from "./ImmersiveSprintCanvas";
import { BatchRecap } from "./BatchRecap";

export function BatchingWorkstation() {
  const setBatchingFocusMode = useTaskStore((s) => s.setBatchingFocusMode);

  const {
    phase,
    clusters,
    unbatched,
    activeBucket,
    currentTask,
    currentTaskIndex,
    totalInSprint,
    completedIds,
    sprintStartedAt,
    recapStats,
    cardExitMode,
    buckets,
    moveTask,
    removeTaskFromBucket,
    createCustomBucket,
    renameBucket,
    deleteCustomBucket,
    startSprint,
    completeCurrentTask,
    deferCurrentTask,
    skipToEndOfBatch,
    finishSprintTimer,
    exitToDashboard,
  } = useBatchingSession();

  useEffect(() => {
    return () => setBatchingFocusMode(false);
  }, [setBatchingFocusMode]);

  const handleExitSprint = useCallback(() => {
    finishSprintTimer(
      sprintStartedAt ? Date.now() - sprintStartedAt : 0
    );
    exitToDashboard();
  }, [finishSprintTimer, sprintStartedAt, exitToDashboard]);

  const handleRecapExit = useCallback(() => {
    exitToDashboard();
  }, [exitToDashboard]);

  const isImmersive = phase === "execution";

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      <AnimatePresence>
        {phase === "clustering" && (
          <motion.div
            key="cluster-shell"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <Link
              href="/productivity"
              className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/50 transition hover:text-charcoal"
            >
              <ArrowLeft size={16} />
              Productivity hub
            </Link>

            <div className="mb-10 max-w-2xl">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">
                <Boxes size={24} />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal md:text-4xl">
                Task Batching
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-charcoal/50">
                Cluster similar work, drag tasks into focused buckets, then sprint
                through one card at a time in full-screen flow.
              </p>
            </div>

            <BatchManager
              buckets={buckets}
              clusters={clusters}
              unbatched={unbatched}
              onStartSprint={startSprint}
              onMoveTask={moveTask}
              onRemoveTask={removeTaskFromBucket}
              onCreateBucket={createCustomBucket}
              onRenameBucket={renameBucket}
              onDeleteBucket={deleteCustomBucket}
            />
          </motion.div>
        )}

        {phase === "recap" && recapStats && (
          <motion.div
            key="recap-shell"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex min-h-[60vh] items-center justify-center"
          >
            <BatchRecap stats={recapStats} onExit={handleRecapExit} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isImmersive && activeBucket && (
          <ImmersiveSprintCanvas
            key="sprint-canvas"
            bucket={activeBucket}
            currentTask={currentTask}
            currentIndex={currentTaskIndex}
            total={totalInSprint}
            sprintStartedAt={sprintStartedAt}
            cardExitMode={cardExitMode}
            onComplete={completeCurrentTask}
            onDefer={deferCurrentTask}
            onSkipToEnd={skipToEndOfBatch}
            onSessionTimerEnd={finishSprintTimer}
            onExit={handleExitSprint}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
