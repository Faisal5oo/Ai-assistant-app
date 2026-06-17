/**
 * Cross-device workspace reconciliation — picks authoritative session state
 * and recalculates live timers from server timestamps.
 */

/**
 * @param {{ updatedAt?: number } | null | undefined} local
 * @param {{ updatedAt?: number } | null | undefined} remote
 * @returns {boolean}
 */
export function shouldPreferRemote(local, remote) {
  if (!remote) return false;
  if (!local) return true;
  const localTs = local.updatedAt ?? 0;
  const remoteTs = remote.updatedAt ?? 0;
  return remoteTs >= localTs;
}

/**
 * @param {import('@/lib/focusSessionStorage').PersistedFocusSession | null} local
 * @param {import('@/lib/focusSessionStorage').PersistedFocusSession | null | undefined} remote
 * @returns {import('@/lib/focusSessionStorage').PersistedFocusSession | null}
 */
export function reconcileFocusSession(local, remote) {
  const winner = shouldPreferRemote(local, remote) ? remote : local;
  if (!winner?.taskId) return null;
  return recalculateFocusSession(winner);
}

/**
 * @param {import('@/lib/focusSessionStorage').PersistedFocusSession} session
 * @returns {import('@/lib/focusSessionStorage').PersistedFocusSession}
 */
export function recalculateFocusSession(session) {
  if (!session.isRunning || !session.startedAt) {
    return { ...session, updatedAt: Date.now() };
  }

  const liveElapsed =
    session.elapsedMs + Math.max(0, Date.now() - session.startedAt);

  return {
    ...session,
    elapsedMs: liveElapsed,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession | null} local
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession | null | undefined} remote
 * @returns {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession | null}
 */
export function reconcileDeepWorkSession(local, remote) {
  const winner = shouldPreferRemote(local, remote) ? remote : local;
  if (!winner?.sessionId) return null;
  return recalculateDeepWorkSession(winner);
}

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession} session
 * @returns {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession}
 */
export function recalculateDeepWorkSession(session) {
  if (!session.timerRunning || !session.endsAt) {
    return { ...session, updatedAt: Date.now() };
  }

  const now = Date.now();
  if (now >= session.endsAt) {
    return {
      ...session,
      timerRunning: false,
      timerStartedAt: null,
      updatedAt: now,
    };
  }

  return { ...session, updatedAt: now };
}

/**
 * @param {import('@/lib/batchSprintStorage').PersistedBatchSprint | null} local
 * @param {import('@/lib/batchSprintStorage').PersistedBatchSprint | null | undefined} remote
 * @returns {import('@/lib/batchSprintStorage').PersistedBatchSprint | null}
 */
export function reconcileBatchSprint(local, remote) {
  const winner = shouldPreferRemote(local, remote) ? remote : local;
  if (!winner?.category) return null;
  return {
    ...winner,
    updatedAt: winner.updatedAt ?? Date.now(),
  };
}

/**
 * @typedef {Object} PomodoroTimerState
 * @property {string} sessionId
 * @property {string | null} [taskId]
 * @property {'work' | 'shortBreak' | 'longBreak'} phase
 * @property {'focus' | 'short_break' | 'long_break'} type
 * @property {number} secondsLeft
 * @property {boolean} isRunning
 * @property {number} [workMinutes]
 * @property {number} [cycle]
 * @property {string} startedAt
 * @property {number | null} [timerStartedAt]
 * @property {number} [updatedAt]
 */

/**
 * @param {PomodoroTimerState | null} local
 * @param {PomodoroTimerState | null | undefined} remote
 * @returns {PomodoroTimerState | null}
 */
export function reconcilePomodoroTimer(local, remote) {
  const winner = shouldPreferRemote(local, remote) ? remote : local;
  if (!winner?.sessionId) return null;
  return recalculatePomodoroTimer(winner);
}

/**
 * @param {PomodoroTimerState} state
 * @returns {PomodoroTimerState}
 */
export function recalculatePomodoroTimer(state) {
  if (!state.isRunning) {
    return { ...state, updatedAt: Date.now() };
  }

  const anchor = state.timerStartedAt ?? state.updatedAt ?? Date.now();
  const elapsedSec = Math.floor(Math.max(0, Date.now() - anchor) / 1000);

  return {
    ...state,
    secondsLeft: Math.max(0, state.secondsLeft - elapsedSec),
    timerStartedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * @typedef {Object} TimeBlockRunwayState
 * @property {string} date
 * @property {number} hour
 * @property {number} [updatedAt]
 */

/**
 * @param {TimeBlockRunwayState | null} local
 * @param {TimeBlockRunwayState | null | undefined} remote
 * @param {string} todayDate
 * @param {number} currentHour
 * @returns {TimeBlockRunwayState | null}
 */
export function reconcileTimeBlockRunway(local, remote, todayDate, currentHour) {
  const winner = shouldPreferRemote(local, remote) ? remote : local;
  if (!winner?.date) return null;
  if (winner.date !== todayDate || winner.hour !== currentHour) {
    return null;
  }
  return { ...winner, updatedAt: winner.updatedAt ?? Date.now() };
}

/**
 * @param {Object | null | undefined} activeTimeBlock
 * @param {string} todayDate
 * @param {number} currentHour
 * @returns {boolean}
 */
export function hasLiveTimeBlockAllocation(activeTimeBlock, todayDate, currentHour) {
  if (!activeTimeBlock?.tasks?.length) return false;
  return activeTimeBlock.date === todayDate && activeTimeBlock.hour === currentHour;
}
