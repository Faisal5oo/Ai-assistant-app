"use client";

import { useCallback, useMemo, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
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

export function useBatchingSession() {
  const { tasks } = useTasks();
  const toggleTaskComplete = useTaskStore((s) => s.toggleTaskComplete);
  const recordDeepWorkSession = useTaskStore((s) => s.recordDeepWorkSession);
  const setBatchingFocusMode = useTaskStore((s) => s.setBatchingFocusMode);

  const [phase, setPhase] = useState(/** @type {BatchingPhase} */ ("clustering"));
  const [overrides, setOverrides] = useState(/** @type {Record<string, string>} */ ({}));
  const [customBuckets, setCustomBuckets] = useState(/** @type {BatchBucketDef[]} */ ([]));
  const [bucketTitleOverrides, setBucketTitleOverrides] = useState(
    /** @type {Record<string, string>} */ ({})
  );
  const [activeBucketId, setActiveBucketId] = useState(/** @type {string | null} */ (null));
  const [queue, setQueue] = useState(/** @type {string[]} */ ([]));
  const [initialQueueLength, setInitialQueueLength] = useState(0);
  const [completedIds, setCompletedIds] = useState(/** @type {string[]} */ ([]));
  const [skippedCount, setSkippedCount] = useState(0);
  const [sprintStartedAt, setSprintStartedAt] = useState(/** @type {number | null} */ (null));
  const [finalElapsedMs, setFinalElapsedMs] = useState(0);
  const [cardExitMode, setCardExitMode] = useState(/** @type {CardExitMode} */ (null));

  const buckets = useMemo(
    () => getAllBuckets(customBuckets, bucketTitleOverrides),
    [customBuckets, bucketTitleOverrides]
  );

  const { clusters, unbatched } = useMemo(
    () => buildBatchLayout(tasks, overrides, customBuckets),
    [tasks, overrides, customBuckets]
  );

  const removeTaskFromBucket = useCallback((taskId) => {
    setOverrides((prev) => {
      if (!(taskId in prev)) return prev;
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  }, []);

  const assignTaskToBucket = useCallback((taskId, bucketId) => {
    setOverrides((prev) => {
      if (prev[taskId] === bucketId) return prev;
      return { ...prev, [taskId]: bucketId };
    });
  }, []);

  const moveTask = useCallback(
    (taskId, zoneId) => {
      if (zoneId === POOL_ZONE_ID) {
        removeTaskFromBucket(taskId);
        return;
      }
      assignTaskToBucket(taskId, zoneId);
    },
    [removeTaskFromBucket, assignTaskToBucket]
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

  const deleteCustomBucket = useCallback((bucketId) => {
    setCustomBuckets((prev) => prev.filter((b) => b.id !== bucketId));
    setOverrides((prev) => {
      const next = { ...prev };
      for (const [taskId, assigned] of Object.entries(next)) {
        if (assigned === bucketId) delete next[taskId];
      }
      return next;
    });
    setBucketTitleOverrides((prev) => {
      const next = { ...prev };
      delete next[bucketId];
      return next;
    });
  }, []);

  const startSprint = useCallback(
    (bucketId) => {
      const bucketTasks = clusters[bucketId];
      if (!bucketTasks?.length) return false;

      const ids = bucketTasks.map((t) => t.id);
      setActiveBucketId(bucketId);
      setQueue(ids);
      setInitialQueueLength(ids.length);
      setCompletedIds([]);
      setSkippedCount(0);
      setFinalElapsedMs(0);
      setCardExitMode(null);
      setSprintStartedAt(Date.now());
      setBatchingFocusMode(true);
      setPhase("execution");
      return true;
    },
    [clusters, setBatchingFocusMode]
  );

  const completeCurrentTask = useCallback(() => {
    if (!queue.length || cardExitMode) return;
    setCardExitMode("complete");

    window.setTimeout(() => {
      const [currentId, ...rest] = queue;
      toggleTaskComplete(currentId);
      setCompletedIds((prev) => [...prev, currentId]);
      setQueue(rest);
      setCardExitMode(null);

      if (rest.length === 0) {
        setPhase("recap");
        setBatchingFocusMode(false);
      }
    }, 340);
  }, [queue, toggleTaskComplete, cardExitMode, setBatchingFocusMode]);

  const deferCurrentTask = useCallback(() => {
    if (!queue.length || cardExitMode) return;
    if (queue.length <= 1) return;

    setCardExitMode("defer");

    window.setTimeout(() => {
      const [currentId, ...rest] = queue;
      setQueue([...rest, currentId]);
      setCardExitMode(null);
    }, 380);
  }, [queue, cardExitMode]);

  const skipToEndOfBatch = useCallback(() => {
    if (!queue.length) return;
    const remaining = queue.length;
    setSkippedCount((n) => n + remaining);
    setQueue([]);
    setBatchingFocusMode(false);
    setPhase("recap");
  }, [queue, setBatchingFocusMode]);

  const finishSprintTimer = useCallback((elapsedMs) => {
    setFinalElapsedMs(elapsedMs);
  }, []);

  const exitToDashboard = useCallback(() => {
    setBatchingFocusMode(false);
    setCardExitMode(null);

    if (completedIds.length > 0 && finalElapsedMs > 0) {
      const share = Math.floor(finalElapsedMs / completedIds.length);
      for (const id of completedIds) {
        recordDeepWorkSession(id, share);
      }
    }

    setPhase("clustering");
    setActiveBucketId(null);
    setQueue([]);
    setInitialQueueLength(0);
    setCompletedIds([]);
    setSkippedCount(0);
    setSprintStartedAt(null);
    setFinalElapsedMs(0);
  }, [
    completedIds,
    finalElapsedMs,
    recordDeepWorkSession,
    setBatchingFocusMode,
  ]);

  const recapStats = useMemo(/** @returns {BatchSprintStats | null} */ () => {
    if (phase !== "recap" || !activeBucketId) return null;
    const bucket = getBucketById(
      activeBucketId,
      customBuckets,
      bucketTitleOverrides
    );
    const total =
      initialQueueLength || completedIds.length + skippedCount;

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

  const currentTask = useMemo(() => {
    if (!queue.length) return null;
    return tasks.find((t) => t.id === queue[0]) ?? null;
  }, [queue, tasks]);

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
    overrides,
    activeBucket,
    activeBucketId,
    queue,
    currentTask,
    currentTaskIndex,
    totalInSprint,
    completedIds,
    skippedCount,
    sprintStartedAt,
    recapStats,
    cardExitMode,
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
    tasks,
  };
}
