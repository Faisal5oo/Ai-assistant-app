export const MS_PER_ESTIMATED_MINUTE = 60_000;

/**
 * @param {number | null | undefined} actualTimeSpent
 * @returns {boolean}
 */
export function isUnsetActualTime(actualTimeSpent) {
  return actualTimeSpent == null || actualTimeSpent === 0;
}

/**
 * @param {number | null | undefined} minutes
 * @returns {number}
 */
export function estimatedMinutesToMs(minutes) {
  return Math.max(0, Math.round((minutes ?? 0) * MS_PER_ESTIMATED_MINUTE));
}

/**
 * Credit estimated duration when a task is completed without tracked focus time.
 *
 * @param {{ actualTimeSpent?: number | null, estimatedTime?: number | null }} existingTask
 * @param {{ actualTimeSpent?: number | null }} [updates]
 * @returns {number | null} milliseconds to assign, or null when no fallback applies
 */
export function resolveCompletionFallbackMs(existingTask, updates = {}) {
  const proposedActual =
    updates.actualTimeSpent !== undefined
      ? updates.actualTimeSpent
      : existingTask?.actualTimeSpent;

  if (!isUnsetActualTime(proposedActual)) return null;

  const minutes = existingTask?.estimatedTime;
  if (!minutes || minutes <= 0) return null;

  return estimatedMinutesToMs(minutes);
}

/**
 * @param {boolean} isTransitionToCompleted
 * @param {{ actualTimeSpent?: number | null, estimatedTime?: number | null }} existingTask
 * @param {Record<string, unknown>} [updates]
 * @returns {number | null}
 */
export function resolveCompletionFallbackOnTransition(
  isTransitionToCompleted,
  existingTask,
  updates = {}
) {
  if (!isTransitionToCompleted) return null;
  return resolveCompletionFallbackMs(existingTask, updates);
}

