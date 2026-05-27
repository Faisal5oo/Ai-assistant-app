/**
 * @param {import('@/types/interfaces').ActiveTimer} timer
 * @returns {number}
 */
export function computeDisplayMs(timer) {
  if (!timer.taskId) return 0;
  if (timer.isRunning && timer.startedAt) {
    return Date.now() - timer.startedAt + timer.elapsedMs;
  }
  return timer.elapsedMs;
}

/** @type {Record<import('@/types/interfaces').ProductivityTechnique, number>} */
export const TECHNIQUE_DURATIONS_MS = {
  pomodoro: 25 * 60 * 1000,
  "deep-work": 90 * 60 * 1000,
  flow: 45 * 60 * 1000,
};
