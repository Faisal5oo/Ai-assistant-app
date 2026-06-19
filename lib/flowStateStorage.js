const STORAGE_KEY = "taskflow:active-flow-session";

/**
 * @typedef {Object} PersistedFlowSession
 * @property {string} primaryTaskId
 * @property {string} primaryTaskTitle
 * @property {string[]} targetTaskIds
 * @property {string[]} runwayQueue
 * @property {number} durationMinutes
 * @property {number} startedAt
 * @property {number} updatedAt
 */

/**
 * @param {PersistedFlowSession} session
 */
export function writeFlowSessionToStorage(session) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...session, updatedAt: Date.now() })
    );
  } catch {
    /* quota / private mode */
  }
}

/** @returns {PersistedFlowSession | null} */
export function readFlowSessionFromStorage() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed?.primaryTaskId ||
      !parsed?.durationMinutes ||
      !parsed?.startedAt
    )
      return null;
    return parsed;
  } catch {
    return null;
  }
}

export function purgeFlowSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
