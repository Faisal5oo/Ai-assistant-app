import { dashboardApi } from "@/lib/api-client";
import { computeDisplayMs } from "@/lib/timerUtils";
import {
  writeFocusSessionToStorage,
  purgeFocusSessionStorage,
  serializeFocusSession,
} from "@/lib/focusSessionStorage";
import {
  checkpointFocusSessionRemote,
  clearFocusSessionRemote,
} from "@/lib/workspaceSync";

/**
 * Mirror session to localStorage (sync).
 */
export function mirrorFocusSessionLocal(activeTimer, activeTechnique) {
  writeFocusSessionToStorage(activeTimer, activeTechnique);
}

/**
 * Checkpoint paused/running session to MongoDB (fire-and-forget).
 */
export function checkpointFocusSessionRemoteLegacy(activeTimer, activeTechnique) {
  const payload = serializeFocusSession(activeTimer, activeTechnique);
  if (!payload) return;
  checkpointFocusSessionRemote(payload);
}

/**
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function persistFocusSession(activeTimer, activeTechnique) {
  mirrorFocusSessionLocal(activeTimer, activeTechnique);
  checkpointFocusSessionRemoteLegacy(activeTimer, activeTechnique);
}

/**
 * Pause checkpoint — local + remote PATCH.
 */
export function checkpointPausedSession(activeTimer, activeTechnique) {
  mirrorFocusSessionLocal(activeTimer, activeTechnique);
  checkpointFocusSessionRemoteLegacy(activeTimer, activeTechnique);
}

/**
 * Running snapshot with live elapsed folded into storage for crash/refresh safety.
 */
export function snapshotRunningSession(activeTimer, activeTechnique) {
  if (!activeTimer.taskId || !activeTimer.isRunning) return;

  const liveMs = computeDisplayMs(activeTimer);
  const snapshot = {
    ...activeTimer,
    elapsedMs: liveMs,
    startedAt: Date.now(),
    isRunning: true,
  };

  writeFocusSessionToStorage(snapshot, activeTechnique);
  checkpointFocusSessionRemoteLegacy(snapshot, activeTechnique);
}

export function purgeFocusSession() {
  purgeFocusSessionStorage();
  clearFocusSessionRemote();
}

/** @deprecated use checkpointFocusSessionRemoteLegacy */
export { checkpointFocusSessionRemoteLegacy as checkpointFocusSessionRemote };
