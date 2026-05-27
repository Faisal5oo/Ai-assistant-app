"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Grid2x2 } from "lucide-react";
import { EISENHOWER_QUADRANTS, EISENHOWER_SPRING } from "@/lib/eisenhower";
import { useEisenhowerDrag } from "@/hooks/useEisenhowerDrag";
import { useEisenhowerWorkspace } from "@/hooks/useEisenhowerWorkspace";
import { EisenhowerDragGhost } from "./EisenhowerDragGhost";
import { UnallocatedInbox } from "./UnallocatedInbox";
import { EisenhowerQuadrantPanel } from "./EisenhowerQuadrantPanel";

export function EisenhowerWorkstation() {
  const [hoverZone, setHoverZone] = useState(/** @type {string | null} */ (null));
  const [purgingIds, setPurgingIds] = useState(
    /** @type {Set<string>} */ (new Set())
  );

  const {
    unallocated,
    quadrants,
    weeklyStrategicProgress,
    weeklyStrategicCount,
    weeklyStrategicGoal,
    assignToZone,
    purgeTask,
    updateDelegateMeta,
  } = useEisenhowerWorkspace();

  const runPurgeAnimation = useCallback(
    (taskId) => {
      setPurgingIds((prev) => new Set(prev).add(taskId));
      setTimeout(() => {
        purgeTask(taskId);
        setPurgingIds((prev) => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 450);
    },
    [purgeTask]
  );

  const handleDrop = useCallback(
    (taskId, zoneId) => {
      if (zoneId === "purge") {
        assignToZone(taskId, "4");
        runPurgeAnimation(taskId);
        return;
      }
      assignToZone(taskId, zoneId);
    },
    [assignToZone, runPurgeAnimation]
  );

  const { session, isDragging, draggingTaskId, startDrag, registerGhostMover } =
    useEisenhowerDrag({
      onDrop: handleDrop,
      onHoverZone: setHoverZone,
    });

  const handleDragStart = useCallback(
    (taskId, title, x, y, sourceZone) => {
      startDrag(taskId, title, x, y, sourceZone);
    },
    [startDrag]
  );

  const handlePurge = useCallback(
    (taskId) => {
      runPurgeAnimation(taskId);
    },
    [runPurgeAnimation]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={EISENHOWER_SPRING}
      className="relative min-h-[calc(100vh-8rem)]"
    >
      <Link
        href="/productivity"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium tracking-tight text-charcoal/50 transition hover:text-charcoal"
      >
        <ArrowLeft size={16} />
        Productivity hub
      </Link>

      <div className="mb-8 max-w-3xl">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">
          <Grid2x2 size={24} />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal md:text-4xl">
          Eisenhower Matrix
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed tracking-tight text-charcoal/50">
          Segregate noise from strategic leverage. Drag tasks across quadrants —
          your matrix syncs when you release.
        </p>
      </div>

      <div className="flex flex-col gap-5 lg:flex-row">
        <UnallocatedInbox
          tasks={unallocated}
          draggingTaskId={draggingTaskId}
          isHoverTarget={hoverZone === "inbox"}
          onDragStart={handleDragStart}
        />

        <div className="grid min-w-0 flex-1 grid-cols-1 items-start gap-4 md:grid-cols-2">
          {EISENHOWER_QUADRANTS.map((q) => (
            <EisenhowerQuadrantPanel
              key={q}
              quadrant={q}
              tasks={quadrants[q]}
              purgingIds={purgingIds}
              isHoverTarget={hoverZone === String(q)}
              draggingTaskId={draggingTaskId}
              weeklyProgress={
                q === 2 ? weeklyStrategicProgress : undefined
              }
              weeklyCount={q === 2 ? weeklyStrategicCount : undefined}
              weeklyGoal={q === 2 ? weeklyStrategicGoal : undefined}
              onDragStart={handleDragStart}
              onPurge={q === 4 ? handlePurge : undefined}
              onUpdateMeta={q === 3 ? updateDelegateMeta : undefined}
            />
          ))}
        </div>
      </div>

      {isDragging && session.taskTitle && (
        <EisenhowerDragGhost
          title={session.taskTitle}
          initialX={session.startX}
          initialY={session.startY}
          registerMover={registerGhostMover}
        />
      )}
    </motion.div>
  );
}
