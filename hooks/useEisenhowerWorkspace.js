"use client";

import { useCallback, useMemo } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import {
  EISENHOWER_INBOX_ZONE,
  EISENHOWER_QUADRANTS,
  WEEKLY_STRATEGIC_GOAL,
  getTaskEisenhowerZone,
} from "@/lib/eisenhower";

/**
 * @returns {{
 *   unallocated: import('@/types/interfaces').Task[];
 *   quadrants: Record<import('@/types/interfaces').EisenhowerQuadrant, import('@/types/interfaces').Task[]>;
 *   weeklyStrategicProgress: number;
 *   weeklyStrategicCount: number;
 *   weeklyStrategicGoal: number;
 *   assignToZone: (taskId: string, zoneId: string) => void;
 *   purgeTask: (taskId: string) => void;
 *   updateDelegateMeta: (taskId: string, meta: { delegateTo?: string; automateCandidate?: boolean }) => void;
 * }}
 */
export function useEisenhowerWorkspace() {
  const tasks = useTaskStore((s) => s.tasks);
  const setEisenhowerQuadrant = useTaskStore((s) => s.setEisenhowerQuadrant);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const updateEisenhowerMeta = useTaskStore((s) => s.updateEisenhowerMeta);

  const { unallocated, quadrants, weeklyStrategicCount } = useMemo(() => {
    /** @type {import('@/types/interfaces').Task[]} */
    const inbox = [];
    /** @type {Record<import('@/types/interfaces').EisenhowerQuadrant, import('@/types/interfaces').Task[]>} */
    const buckets = { 1: [], 2: [], 3: [], 4: [] };
    let strategic = 0;

    for (const task of tasks) {
      if (task.status === "Completed") continue;
      const zone = getTaskEisenhowerZone(task);
      if (!zone) {
        inbox.push(task);
        continue;
      }
      buckets[zone].push(task);
      if (zone === 2) strategic += 1;
    }

    return {
      unallocated: inbox,
      quadrants: buckets,
      weeklyStrategicCount: strategic,
    };
  }, [tasks]);

  const weeklyStrategicProgress = Math.min(
    1,
    weeklyStrategicCount / WEEKLY_STRATEGIC_GOAL
  );

  const assignToZone = useCallback(
    (taskId, zoneId) => {
      if (zoneId === "purge") {
        deleteTask(taskId);
        return;
      }
      if (zoneId === EISENHOWER_INBOX_ZONE) {
        setEisenhowerQuadrant(taskId, null);
        return;
      }
      const q = Number(zoneId);
      if (EISENHOWER_QUADRANTS.includes(/** @type {import('@/types/interfaces').EisenhowerQuadrant} */ (q))) {
        setEisenhowerQuadrant(
          taskId,
          /** @type {import('@/types/interfaces').EisenhowerQuadrant} */ (q)
        );
      }
    },
    [setEisenhowerQuadrant, deleteTask]
  );

  const purgeTask = useCallback(
    (taskId) => {
      deleteTask(taskId);
    },
    [deleteTask]
  );

  const updateDelegateMeta = useCallback(
    (taskId, meta) => {
      updateEisenhowerMeta(taskId, meta);
    },
    [updateEisenhowerMeta]
  );

  return {
    unallocated,
    quadrants,
    weeklyStrategicProgress,
    weeklyStrategicCount,
    weeklyStrategicGoal: WEEKLY_STRATEGIC_GOAL,
    assignToZone,
    purgeTask,
    updateDelegateMeta,
  };
}
