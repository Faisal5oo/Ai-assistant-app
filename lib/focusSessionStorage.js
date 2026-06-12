const STORAGE_KEY = "taskflow:focus-session";

/**
 * @typedef {Object} PersistedFocusSession
 * @property {string} taskId
 * @property {boolean} isRunning
 * @property {number} startedAt
 * @property {number} elapsedMs
 * @property {import('@/types/interfaces').TimerMode} [mode]
 * @property {number} [targetMs]
 * @property {import('@/types/interfaces').ProductivityTechnique | null} [activeTechnique]
 * @property {number} updatedAt
 */

/**
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 * @returns {PersistedFocusSession | null}
 */
export function serializeFocusSession(activeTimer, activeTechnique) {
  if (!activeTimer.taskId) return null;

  return {
    taskId: activeTimer.taskId,
    isRunning: activeTimer.isRunning,
    startedAt: activeTimer.isRunning ? activeTimer.startedAt : 0,
    elapsedMs: activeTimer.elapsedMs,
    mode: activeTimer.mode,
    ...(activeTimer.targetMs != null ? { targetMs: activeTimer.targetMs } : {}),
    ...(activeTechnique ? { activeTechnique } : { activeTechnique: null }),
    updatedAt: Date.now(),
  };
}

/**
 * @param {import('@/types/interfaces').ActiveTimer} activeTimer
 * @param {import('@/types/interfaces').ProductivityTechnique | null} activeTechnique
 */
export function writeFocusSessionToStorage(activeTimer, activeTechnique) {
  if (typeof window === "undefined") return;

  const payload = serializeFocusSession(activeTimer, activeTechnique);
  if (!payload) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** @returns {PersistedFocusSession | null} */
export function readFocusSessionFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.taskId || typeof parsed.elapsedMs !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function purgeFocusSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {PersistedFocusSession} session
 * @returns {import('@/types/interfaces').ActiveTimer}
 */
export function toActiveTimerFromPersisted(session) {
  return {
    taskId: session.taskId,
    isRunning: Boolean(session.isRunning),
    startedAt: session.isRunning ? session.startedAt || Date.now() : 0,
    elapsedMs: session.elapsedMs,
    mode: session.mode ?? "work",
    targetMs: session.targetMs,
  };
}
