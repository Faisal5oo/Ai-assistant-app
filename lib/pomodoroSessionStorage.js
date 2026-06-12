const STORAGE_KEY = "taskflow:pomodoro-session";

/**
 * @typedef {Object} PersistedPomodoroSession
 * @property {string} id
 * @property {string | null} taskId
 * @property {import('@/types/interfaces').PomodoroSessionType} type
 * @property {string} startedAt
 * @property {number} [plannedDurationMinutes]
 * @property {import('@/types/interfaces').PomodoroPhase} phase
 */

/** @returns {PersistedPomodoroSession | null} */
export function readPomodoroSessionFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.id || !parsed?.type || !parsed?.startedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @param {PersistedPomodoroSession | null} session */
export function writePomodoroSessionToStorage(session) {
  if (typeof window === "undefined") return;

  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* quota / private mode */
  }
}

export function purgePomodoroSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** @param {import('@/types/interfaces').PomodoroPhase} phase */
export function phaseToSessionType(phase) {
  if (phase === "work") return "focus";
  if (phase === "shortBreak") return "short_break";
  return "long_break";
}

/** @param {number} totalSeconds @param {number} secondsLeft */
export function elapsedMinutesFromTimer(totalSeconds, secondsLeft) {
  const elapsedSeconds = Math.max(0, totalSeconds - secondsLeft);
  return Math.round((elapsedSeconds / 60) * 100) / 100;
}
