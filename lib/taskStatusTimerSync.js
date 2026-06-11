import { recordTaskTimeImperative } from "@/lib/imperative-mutations";
import { todayKey } from "@/lib/utils";
import { useTaskStore } from "@/store/useTaskStore";

/** @returns {import('@/types/interfaces').ActiveTimer} */
function initialTimer() {
  return {
    taskId: null,
    isRunning: false,
    startedAt: 0,
    elapsedMs: 0,
    mode: "work",
    targetMs: undefined,
  };
}

/**
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @returns {number}
 */
export function getSessionMs(activeTimer) {
  if (!activeTimer.taskId) return 0;
  let sessionMs = activeTimer.elapsedMs;
  if (activeTimer.isRunning && activeTimer.startedAt) {
    sessionMs = Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
  }
  return sessionMs;
}

export function captureTimerSnapshot() {
  const { activeTimer, activeTechnique } = useTaskStore.getState();
  return {
    activeTimer: { ...activeTimer },
    activeTechnique,
  };
}

/** @param {{ activeTimer: import('@/types/interfaces').ActiveTimer; activeTechnique: import('@/types/interfaces').ProductivityTechnique | null } | undefined} snapshot */
export function restoreTimerSnapshot(snapshot) {
  if (!snapshot) return;
  useTaskStore.setState({
    activeTimer: { ...snapshot.activeTimer },
    activeTechnique: snapshot.activeTechnique,
  });
}

/**
 * Finalize the current timer session, optionally persisting elapsed time.
 * Keeps task status unchanged (In-Progress stays In-Progress).
 * @param {boolean} [recordToDb]
 */
export function finalizeActiveTimerSession(recordToDb = true) {
  const { activeTimer } = useTaskStore.getState();
  if (!activeTimer.taskId) return;

  const sessionMs = getSessionMs(activeTimer);
  const taskId = activeTimer.taskId;

  useTaskStore.setState({
    activeTimer: initialTimer(),
    activeTechnique: null,
  });

  if (recordToDb && sessionMs > 0) {
    recordTaskTimeImperative(taskId, sessionMs, todayKey());
  }
}

/**
 * @param {string} taskId
 * @param {import('@/types/interfaces').TaskStatus} previousStatus
 * @param {import('@/types/interfaces').TaskStatus} nextStatus
 */
export function syncTimerForStatusChange(taskId, previousStatus, nextStatus) {
  if (previousStatus === nextStatus) return;

  const { activeTimer, stopTimer } = useTaskStore.getState();

  if (nextStatus === "Completed" && activeTimer.taskId === taskId) {
    stopTimer();
    return;
  }

  if (
    previousStatus === "In-Progress" &&
    nextStatus !== "In-Progress" &&
    activeTimer.taskId === taskId
  ) {
    stopTimer();
  }
}

/**
 * @param {import('@/types/interfaces').Task[]} previousTasks
 * @param {import('@/types/interfaces').Task[]} nextTasks
 */
export function diffAndSyncTimer(previousTasks, nextTasks) {
  const prevList = previousTasks ?? [];
  const nextList = nextTasks ?? [];
  const prevMap = new Map(prevList.map((t) => [t.id, t]));

  for (const task of nextList) {
    const prev = prevMap.get(task.id);
    if (prev && prev.status !== task.status) {
      syncTimerForStatusChange(task.id, prev.status, task.status);
    }
  }
}
