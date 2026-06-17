"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import {
  endBatchSprintImperative,
  updateBatchCategoryImperative,
} from "@/lib/imperative-mutations";
import { useWorkspaceMountSync } from "@/hooks/useWorkspaceMountSync";
import { readBatchSprintFromStorage } from "@/lib/batchSprintStorage";
import {
  reconcileBatchSprint,
  shouldPreferRemote,
} from "@/lib/workspaceReconciliation";
import { checkpointBatchSprintRemote } from "@/lib/workspaceSync";
import {
  buildBatchLayout,
  computeFocusEfficiency,
  createCustomBucketId,
  CUSTOM_BUCKET_TEMPLATE,
  getAllBuckets,
  getBucketById,
  POOL_ZONE_ID,
} from "@/lib/batchingConstants";

/** @typedef {'clustering' | 'execution' | 'recap'} BatchingPhase */
/** @typedef {'complete' | 'defer' | null} CardExitMode */
/** @typedef {import('@/lib/batchingConstants').BatchBucketDef} BatchBucketDef */

/**
 * @typedef {Object} BatchSprintStats
 * @property {number} totalMs
 * @property {number} tasksCrushed
 * @property {number} skipped
 * @property {number} focusEfficiency
 * @property {string} bucketTitle
 */

/**
 * @param {import('@/lib/batchSprintStorage').PersistedBatchSprint | null} sprint
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {import('@/lib/batchSprintStorage').PersistedBatchSprint | null}
 */
function reconcileSprintQueue(sprint, tasks) {
  if (!sprint || sprint.phase !== "execution") return sprint;

  const categoryTasks = tasks.filter(
    (t) => t.status !== "Completed" && t.batchCategory === sprint.category
  );
  const validIds = new Set(categoryTasks.map((t) => t.id));
  const completedSet = new Set(sprint.completedIds);

  const queue = sprint.queue.filter(
    (id) => validIds.has(id) && !completedSet.has(id)
  );

  for (const task of categoryTasks) {
    if (!completedSet.has(task.id) && !queue.includes(task.id)) {
      queue.push(task.id);
    }
  }

  if (queue.length === 0 && sprint.queue.length > 0) {
    return { ...sprint, queue: [], phase: "recap" };
  }

  return { ...sprint, queue };
}

export function useBatchingSession() {
  const { tasks, isLoading } = useTasks();
  const toggleTaskComplete = useTaskStore((s) => s.toggleTaskComplete);
  const recordDeepWorkSession = useTaskStore((s) => s.recordDeepWorkSession);
  const activeBatchSprint = useTaskStore((s) => s.activeBatchSprint);
  const setActiveBatchSprint = useTaskStore((s) => s.setActiveBatchSprint);
  const clearActiveBatchSprint = useTaskStore((s) => s.clearActiveBatchSprint);
  const hydrateActiveBatchSprint = useTaskStore((s) => s.hydrateActiveBatchSprint);

  const [customBuckets, setCustomBuckets] = useState(/** @type {BatchBucketDef[]} */ ([]));
  const [bucketTitleOverrides, setBucketTitleOverrides] = useState(
    /** @type {Record<string, string>} */ ({})
  );
  const [cardExitMode, setCardExitMode] = useState(/** @type {CardExitMode} */ (null));
  const [celebratingComplete, setCelebratingComplete] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrateActiveBatchSprint();
    setHydrated(true);
  }, [hydrateActiveBatchSprint]);

  useWorkspaceMountSync("batching", {
    onBatching: useCallback(
      (workspace) => {
        const local = readBatchSprintFromStorage();
        const remote = workspace.activeBatchSprint ?? null;
        const winner = reconcileBatchSprint(local, remote);

        if (winner) {
          setActiveBatchSprint(winner);
        } else if (!local && !remote) {
          clearActiveBatchSprint();
        }

        if (local && remote && !shouldPreferRemote(local, remote)) {
          checkpointBatchSprintRemote(local);
        }
      },
      [setActiveBatchSprint, clearActiveBatchSprint]
    ),
  });

  const buckets = useMemo(
    () => getAllBuckets(customBuckets, bucketTitleOverrides),
    [customBuckets, bucketTitleOverrides]
  );

  const { clusters, unbatched } = useMemo(
    () => buildBatchLayout(tasks, customBuckets),
    [tasks, customBuckets]
  );

  const phase = useMemo(/** @returns {BatchingPhase} */ () => {
    if (!activeBatchSprint) return "clustering";
    if (activeBatchSprint.phase === "recap") return "recap";
    return "execution";
  }, [activeBatchSprint]);

  const activeBucketId = activeBatchSprint?.category ?? null;
  const queue = activeBatchSprint?.queue ?? [];
  const completedIds = activeBatchSprint?.completedIds ?? [];
  const skippedCount = activeBatchSprint?.skippedCount ?? 0;
  const initialQueueLength = activeBatchSprint?.initialQueueLength ?? 0;
  const sprintStartedAt = activeBatchSprint?.startedAt ?? null;
  const finalElapsedMs = activeBatchSprint?.finalElapsedMs ?? 0;

  useEffect(() => {
    if (
      !hydrated ||
      isLoading ||
      !activeBatchSprint ||
      activeBatchSprint.phase !== "execution"
    ) {
      return;
    }
    const reconciled = reconcileSprintQueue(activeBatchSprint, tasks);
    if (
      reconciled &&
      (reconciled.queue.length !== activeBatchSprint.queue.length ||
        reconciled.phase !== activeBatchSprint.phase)
    ) {
      setActiveBatchSprint(reconciled);
    }
  }, [tasks, isLoading, hydrated, activeBatchSprint, setActiveBatchSprint]);

  const patchSprint = useCallback(
    /** @param {Partial<import('@/lib/batchSprintStorage').PersistedBatchSprint>} patch */
    (patch) => {
      if (!activeBatchSprint) return;
      setActiveBatchSprint({ ...activeBatchSprint, ...patch });
    },
    [activeBatchSprint, setActiveBatchSprint]
  );

  const removeTaskFromBucket = useCallback((taskId) => {
    updateBatchCategoryImperative(taskId, null);
  }, []);

  const assignTaskToBucket = useCallback((taskId, bucketId) => {
    updateBatchCategoryImperative(taskId, bucketId);
  }, []);

  const moveTask = useCallback(
    (taskId, zoneId) => {
      const batchCategory = zoneId === POOL_ZONE_ID ? null : zoneId;
      updateBatchCategoryImperative(taskId, batchCategory);
    },
    []
  );

  const createCustomBucket = useCallback(() => {
    const id = createCustomBucketId();
    setCustomBuckets((prev) => [
      ...prev,
      {
        ...CUSTOM_BUCKET_TEMPLATE,
        id,
        title: "New Batch",
      },
    ]);
    setBucketTitleOverrides((prev) => ({ ...prev, [id]: "New Batch" }));
    return id;
  }, []);

  const renameBucket = useCallback((bucketId, title) => {
    setBucketTitleOverrides((prev) => ({ ...prev, [bucketId]: title }));
    setCustomBuckets((prev) =>
      prev.map((b) => (b.id === bucketId ? { ...b, title } : b))
    );
  }, []);

  const deleteCustomBucket = useCallback(
    (bucketId) => {
      const bucketTasks = clusters[bucketId] ?? [];
      for (const task of bucketTasks) {
        updateBatchCategoryImperative(task.id, null);
      }
      setCustomBuckets((prev) => prev.filter((b) => b.id !== bucketId));
      setBucketTitleOverrides((prev) => {
        const next = { ...prev };
        delete next[bucketId];
        return next;
      });
    },
    [clusters]
  );

  const startSprint = useCallback(
    (bucketId) => {
      const bucketTasks = clusters[bucketId];
      if (!bucketTasks?.length) return false;

      const ids = bucketTasks.map((t) => t.id);
      setActiveBatchSprint({
        category: bucketId,
        phase: "execution",
        startedAt: Date.now(),
        queue: ids,
        completedIds: [],
        skippedCount: 0,
        initialQueueLength: ids.length,
        finalElapsedMs: 0,
      });
      return true;
    },
    [clusters, setActiveBatchSprint]
  );

  const finishCelebrationAndAdvance = useCallback(() => {
    if (!activeBatchSprint || !queue.length) return;

    const [currentId, ...rest] = queue;
    toggleTaskComplete(currentId);
    const nextCompleted = [...completedIds, currentId];
    setCardExitMode(null);
    setCelebratingComplete(false);

    if (rest.length === 0) {
      setActiveBatchSprint({
        ...activeBatchSprint,
        queue: [],
        completedIds: nextCompleted,
        phase: "recap",
      });
      return;
    }

    patchSprint({ queue: rest, completedIds: nextCompleted });
  }, [
    activeBatchSprint,
    queue,
    completedIds,
    toggleTaskComplete,
    patchSprint,
    setActiveBatchSprint,
  ]);

  const completeCurrentTask = useCallback(() => {
    if (!queue.length || cardExitMode || celebratingComplete) return;
    setCardExitMode("complete");
    setCelebratingComplete(true);
  }, [queue, cardExitMode, celebratingComplete]);

  useEffect(() => {
    if (!celebratingComplete) return undefined;
    const timer = window.setTimeout(finishCelebrationAndAdvance, 1100);
    return () => window.clearTimeout(timer);
  }, [celebratingComplete, finishCelebrationAndAdvance]);

  const deferCurrentTask = useCallback(() => {
    if (!queue.length || cardExitMode || celebratingComplete) return;
    if (queue.length <= 1) return;

    setCardExitMode("defer");

    window.setTimeout(() => {
      const [currentId, ...rest] = queue;
      patchSprint({ queue: [...rest, currentId] });
      setCardExitMode(null);
    }, 380);
  }, [queue, cardExitMode, celebratingComplete, patchSprint]);

  const skipToEndOfBatch = useCallback(() => {
    if (!activeBatchSprint || !queue.length) return;
    const remaining = queue.length;
    setActiveBatchSprint({
      ...activeBatchSprint,
      queue: [],
      skippedCount: skippedCount + remaining,
      phase: "recap",
    });
  }, [activeBatchSprint, queue, skippedCount, setActiveBatchSprint]);

  const finishSprintTimer = useCallback(
    (elapsedMs) => {
      if (!activeBatchSprint) return;
      patchSprint({ finalElapsedMs: elapsedMs });
    },
    [activeBatchSprint, patchSprint]
  );

  const logSprintToDatabase = useCallback(
    async (elapsedMs, status) => {
      if (!activeBatchSprint) return;

      const bucket = getBucketById(
        activeBatchSprint.category,
        customBuckets,
        bucketTitleOverrides
      );
      const total =
        activeBatchSprint.initialQueueLength ||
        completedIds.length + skippedCount;
      const focusEfficiency = computeFocusEfficiency(
        completedIds.length,
        skippedCount,
        total
      );

      await endBatchSprintImperative({
        batchCategory: activeBatchSprint.category,
        bucketTitle: bucket.title,
        sessionStartedAt: new Date(activeBatchSprint.startedAt).toISOString(),
        durationMs: elapsedMs,
        tasksTotal: total,
        tasksCompleted: completedIds.length,
        tasksSkipped: skippedCount,
        focusEfficiency,
        status,
      });
    },
    [activeBatchSprint, customBuckets, bucketTitleOverrides, completedIds, skippedCount]
  );

  const exitToDashboard = useCallback(async () => {
    setCardExitMode(null);
    setCelebratingComplete(false);

    const elapsed =
      finalElapsedMs > 0
        ? finalElapsedMs
        : sprintStartedAt
          ? Date.now() - sprintStartedAt
          : 0;

    if (activeBatchSprint && phase === "recap") {
      await logSprintToDatabase(elapsed, "completed");
    } else if (activeBatchSprint && phase === "execution") {
      await logSprintToDatabase(elapsed, "abandoned");
    }

    if (completedIds.length > 0 && elapsed > 0) {
      const share = Math.floor(elapsed / completedIds.length);
      for (const id of completedIds) {
        recordDeepWorkSession(id, share);
      }
    }

    clearActiveBatchSprint();
  }, [
    activeBatchSprint,
    phase,
    finalElapsedMs,
    sprintStartedAt,
    completedIds,
    logSprintToDatabase,
    recordDeepWorkSession,
    clearActiveBatchSprint,
  ]);

  const recapStats = useMemo(/** @returns {BatchSprintStats | null} */ () => {
    if (phase !== "recap" || !activeBucketId) return null;
    const bucket = getBucketById(
      activeBucketId,
      customBuckets,
      bucketTitleOverrides
    );
    const total = initialQueueLength || completedIds.length + skippedCount;

    const elapsedFallback =
      sprintStartedAt != null ? Date.now() - sprintStartedAt : 0;

    return {
      totalMs: finalElapsedMs > 0 ? finalElapsedMs : elapsedFallback,
      tasksCrushed: completedIds.length,
      skipped: skippedCount,
      focusEfficiency: computeFocusEfficiency(
        completedIds.length,
        skippedCount,
        total
      ),
      bucketTitle: bucket.title,
    };
  }, [
    phase,
    activeBucketId,
    customBuckets,
    bucketTitleOverrides,
    completedIds,
    skippedCount,
    initialQueueLength,
    finalElapsedMs,
    sprintStartedAt,
  ]);

  const sprintTasks = useMemo(() => {
    if (!activeBatchSprint) return tasks;
    return tasks.filter((t) => t.batchCategory === activeBatchSprint.category);
  }, [tasks, activeBatchSprint]);

  const currentTask = useMemo(() => {
    if (!queue.length) return null;
    return sprintTasks.find((t) => t.id === queue[0]) ?? null;
  }, [queue, sprintTasks]);

  const activeBucket = activeBucketId
    ? getBucketById(activeBucketId, customBuckets, bucketTitleOverrides)
    : null;
  const currentTaskIndex = completedIds.length + 1;
  const totalInSprint = initialQueueLength || queue.length + completedIds.length;

  return {
    phase,
    clusters,
    unbatched,
    buckets,
    activeBucket,
    activeBucketId,
    activeBatchSprint,
    queue,
    currentTask,
    currentTaskIndex,
    totalInSprint,
    completedIds,
    skippedCount,
    sprintStartedAt,
    recapStats,
    cardExitMode,
    celebratingComplete,
    moveTask,
    assignTaskToBucket,
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
    tasks: sprintTasks,
  };
}
