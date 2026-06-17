import {
  writeDeepWorkSessionToStorage,
  purgeDeepWorkSessionStorage,
  serializeDeepWorkSession,
  buildPersistedPayload,
} from "@/lib/deepWorkSessionStorage";
import {
  checkpointDeepWorkSessionRemote,
  clearDeepWorkSessionRemote,
} from "@/lib/workspaceSync";

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession} payload
 */
export function mirrorDeepWorkSessionLocal(payload) {
  writeDeepWorkSessionToStorage(payload);
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @param {import('@/lib/deepWorkConstants').DeepWorkPhase} phase
 * @param {string[]} distractions
 */
export function persistDeepWorkSession(session, phase, distractions) {
  const payload = buildPersistedPayload(session, phase, distractions);
  mirrorDeepWorkSessionLocal(payload);
  checkpointDeepWorkSessionRemote(payload);
}

/**
 * @param {import('@/hooks/useDeepWorkSession').DeepWorkSession} session
 * @param {import('@/lib/deepWorkConstants').DeepWorkPhase} phase
 * @param {string[]} distractions
 */
export function checkpointDeepWorkSession(session, phase, distractions) {
  persistDeepWorkSession(session, phase, distractions);
}

export function purgeDeepWorkSession() {
  purgeDeepWorkSessionStorage();
  clearDeepWorkSessionRemote();
}

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession | null} persisted
 */
export function applyPersistedDeepWorkSession(persisted) {
  if (!persisted?.sessionId) return null;
  return serializeDeepWorkSession(persisted);
}
