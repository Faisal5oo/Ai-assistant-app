import { dashboardApi } from "@/lib/api-client";
import {
  writeDeepWorkSessionToStorage,
  purgeDeepWorkSessionStorage,
  serializeDeepWorkSession,
  buildPersistedPayload,
} from "@/lib/deepWorkSessionStorage";

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession} payload
 */
export function mirrorDeepWorkSessionLocal(payload) {
  writeDeepWorkSessionToStorage(payload);
}

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession} payload
 */
export function checkpointDeepWorkSessionRemote(payload) {
  dashboardApi
    .update({ activeDeepWorkSession: payload })
    .catch(() => {
      /* non-blocking checkpoint */
    });
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
  dashboardApi.update({ activeDeepWorkSession: null }).catch(() => {
    /* non-blocking */
  });
}

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession | null} persisted
 */
export function applyPersistedDeepWorkSession(persisted) {
  if (!persisted?.sessionId) return null;
  return serializeDeepWorkSession(persisted);
}
