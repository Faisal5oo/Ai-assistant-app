const STORAGE_KEY = "taskflow:active-batch-sprint";

/**
 * @typedef {'execution' | 'recap'} BatchSprintPhase
 */

/**
 * @typedef {Object} PersistedBatchSprint
 * @property {string} category - active batch bucket id
 * @property {BatchSprintPhase} phase
 * @property {number} startedAt - epoch ms
 * @property {string[]} queue - remaining task ids
 * @property {string[]} completedIds
 * @property {number} skippedCount
 * @property {number} initialQueueLength
 * @property {number} [finalElapsedMs]
 * @property {number} [updatedAt]
 */

/**
 * @param {PersistedBatchSprint} sprint
 * @returns {PersistedBatchSprint}
 */
export function serializeBatchSprint(sprint) {
  return {
    ...sprint,
    queue: sprint.queue ?? [],
    completedIds: sprint.completedIds ?? [],
    skippedCount: sprint.skippedCount ?? 0,
    initialQueueLength: sprint.initialQueueLength ?? 0,
    updatedAt: sprint.updatedAt ?? Date.now(),
  };
}

/** @returns {PersistedBatchSprint | null} */
export function readBatchSprintFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.category || !parsed?.startedAt || !parsed?.phase) return null;
    return serializeBatchSprint(parsed);
  } catch {
    return null;
  }
}

/** @param {PersistedBatchSprint | null} sprint */
export function writeBatchSprintToStorage(sprint) {
  if (typeof window === "undefined") return;

  try {
    if (!sprint) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeBatchSprint(sprint)));
  } catch {
    /* quota / private mode */
  }
}

export function purgeBatchSprintStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
