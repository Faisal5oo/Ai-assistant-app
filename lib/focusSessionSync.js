import { dashboardApi } from "@/lib/api-client";
import { computeDisplayMs } from "@/lib/timerUtils";
import {
  writeFocusSessionToStorage,
  purgeFocusSessionStorage,
  serializeFocusSession,
} from "@/lib/focusSessionStorage";

/**
 * Mirror session to localStorage (sync).
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function mirrorFocusSessionLocal(activeTimer, activeTechnique) {
  writeFocusSessionToStorage(activeTimer, activeTechnique);
}

/**
 * Checkpoint paused/running session to MongoDB (fire-and-forget).
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function checkpointFocusSessionRemote(activeTimer, activeTechnique) {
  const payload = serializeFocusSession(activeTimer, activeTechnique);
  if (!payload) return;

  if (!activeTimer.isRunning) {
    payload.elapsedMs = activeTimer.elapsedMs;
    payload.startedAt = 0;
  } else {
    payload.elapsedMs = activeTimer.elapsedMs;
  }

  dashboardApi
    .update({ activeFocusSession: payload })
    .catch(() => {
      /* non-blocking checkpoint */
    });
}

/**
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function persistFocusSession(activeTimer, activeTechnique) {
  mirrorFocusSessionLocal(activeTimer, activeTechnique);
}

/**
 * Pause checkpoint — local + remote PATCH.
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function checkpointPausedSession(activeTimer, activeTechnique) {
  mirrorFocusSessionLocal(activeTimer, activeTechnique);
  checkpointFocusSessionRemote(activeTimer, activeTechnique);
}

/**
 * Running snapshot with live elapsed folded into storage for crash/refresh safety.
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function snapshotRunningSession(activeTimer, activeTechnique) {
  if (!activeTimer.taskId || !activeTimer.isRunning) return;

  const liveMs = computeDisplayMs(activeTimer);
  writeFocusSessionToStorage(
    {
      ...activeTimer,
      elapsedMs: liveMs,
      startedAt: Date.now(),
      isRunning: true,
    },
    activeTechnique
  );
}

export function purgeFocusSession() {
  purgeFocusSessionStorage();
  dashboardApi.update({ activeFocusSession: null }).catch(() => {
    /* non-blocking */
  });
}
