const STORAGE_KEY = "taskflow:deep-work-session";

/**
 * @typedef {import('@/lib/deepWorkConstants').DeepWorkPhase} DeepWorkPhase
 */

/**
 * @typedef {Object} PersistedDeepWorkSession
 * @property {string} sessionId
 * @property {string} taskId
 * @property {string} taskTitle
 * @property {string} objective
 * @property {number} durationMinutes
 * @property {DeepWorkPhase} phase
 * @property {boolean} timerRunning
 * @property {number | null} timerStartedAt
 * @property {number | null} endsAt
 * @property {number} committedAt
 * @property {boolean} [timerFrozen]
 * @property {number | null} [frozenAt]
 * @property {string[]} distractions
 * @property {number} updatedAt
 */

/**
 * @param {Omit<PersistedDeepWorkSession, 'updatedAt'> & { updatedAt?: number }} session
 * @returns {PersistedDeepWorkSession}
 */
export function serializeDeepWorkSession(session) {
  return {
    ...session,
    distractions: session.distractions ?? [],
    updatedAt: session.updatedAt ?? Date.now(),
  };
}

/** @returns {PersistedDeepWorkSession | null} */
export function readDeepWorkSessionFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.sessionId || !parsed?.taskId || !parsed?.objective) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** @param {PersistedDeepWorkSession | null} session */
export function writeDeepWorkSessionToStorage(session) {
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

export function purgeDeepWorkSessionStorage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {PersistedDeepWorkSession} persisted
 * @returns {import('@/hooks/useDeepWorkSession').DeepWorkSession}
 */
export function toDeepWorkSessionFromPersisted(persisted) {
  return {
    sessionId: persisted.sessionId,
    taskId: persisted.taskId,
    taskTitle: persisted.taskTitle,
    objective: persisted.objective,
    durationMinutes: persisted.durationMinutes,
    committedAt: persisted.committedAt,
    timerRunning: persisted.timerRunning,
    timerStartedAt: persisted.timerStartedAt,
    endsAt: persisted.endsAt,
    timerFrozen: persisted.timerFrozen ?? false,
    frozenAt: persisted.frozenAt ?? null,
  };
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @param {DeepWorkPhase} phase
 * @param {string[]} distractions
 * @returns {PersistedDeepWorkSession}
 */
export function buildPersistedPayload(session, phase, distractions) {
  return serializeDeepWorkSession({
    sessionId: session.sessionId,
    taskId: session.taskId,
    taskTitle: session.taskTitle,
    objective: session.objective,
    durationMinutes: session.durationMinutes,
    phase,
    timerRunning: session.timerRunning,
    timerStartedAt: session.timerStartedAt,
    endsAt: session.endsAt,
    committedAt: session.committedAt,
    timerFrozen: session.timerFrozen ?? false,
    frozenAt: session.frozenAt ?? null,
    distractions,
  });
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @returns {number}
 */
export function computeDeepWorkElapsedMinutes(session) {
  if (!session.timerRunning || !session.timerStartedAt) return 0;

  const referenceMs = session.frozenAt ?? Date.now();
  const endsAt =
    session.endsAt ?? session.timerStartedAt + session.durationMinutes * 60_000;
  const elapsedMs = Math.max(0, referenceMs - session.timerStartedAt);
  const capMs = session.durationMinutes * 60_000;
  const actualMs = Math.min(elapsedMs, capMs, Math.max(0, endsAt - session.timerStartedAt));

  return Math.round((actualMs / 60_000) * 100) / 100;
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @returns {number}
 */
export function computeDeepWorkRemainingSeconds(session) {
  if (!session.timerRunning || !session.endsAt) {
    return session.durationMinutes * 60;
  }
  const referenceMs = session.frozenAt ?? Date.now();
  return Math.max(0, Math.ceil((session.endsAt - referenceMs) / 1000));
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @returns {number}
 */
export function computeMinutesSaved(session) {
  const remainingSeconds = computeDeepWorkRemainingSeconds(session);
  return Math.max(0, Math.round(remainingSeconds / 60));
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @returns {number}
 */
export function computeDeepWorkElapsedMs(session) {
  return Math.round(computeDeepWorkElapsedMinutes(session) * 60_000);
}
