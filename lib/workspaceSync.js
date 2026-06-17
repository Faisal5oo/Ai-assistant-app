import { dashboardApi } from "@/lib/api-client";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { patchDashboardCache } from "@/lib/query-cache";

/**
 * @typedef {Object} ActiveWorkspace
 * @property {import('@/lib/focusSessionStorage').PersistedFocusSession} [activeFocusSession]
 * @property {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession} [activeDeepWorkSession]
 * @property {import('@/lib/batchSprintStorage').PersistedBatchSprint} [activeBatchSprint]
 * @property {import('@/lib/workspaceReconciliation').PomodoroTimerState} [activePomodoroTimer]
 * @property {import('@/lib/workspaceReconciliation').TimeBlockRunwayState} [activeTimeBlockRunway]
 * @property {{ date: string, hour: number, rangeLabel?: string, tasks: Array<{ taskId: string, title: string }> } | null} [activeTimeBlock]
 */

/** @returns {Promise<ActiveWorkspace>} */
export async function fetchActiveWorkspace() {
  const res = await fetch("/api/productivity/sync/active-workspace", {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    const { dashboard, activeTimeBlock } = await dashboardApi.getWorkspace();
    return {
      activeFocusSession: dashboard.activeFocusSession,
      activeDeepWorkSession: dashboard.activeDeepWorkSession,
      activeBatchSprint: dashboard.activeBatchSprint,
      activePomodoroTimer: dashboard.activePomodoroTimer,
      activeTimeBlockRunway: dashboard.activeTimeBlockRunway,
      activeTimeBlock: activeTimeBlock ?? null,
    };
  }

  const workspace = data.workspace ?? {};
  patchDashboardCache({
    ...(workspace.activeFocusSession
      ? { activeFocusSession: workspace.activeFocusSession }
      : {}),
    ...(workspace.activeDeepWorkSession
      ? { activeDeepWorkSession: workspace.activeDeepWorkSession }
      : {}),
    ...(workspace.activeBatchSprint
      ? { activeBatchSprint: workspace.activeBatchSprint }
      : {}),
    ...(workspace.activePomodoroTimer
      ? { activePomodoroTimer: workspace.activePomodoroTimer }
      : {}),
    ...(workspace.activeTimeBlockRunway
      ? { activeTimeBlockRunway: workspace.activeTimeBlockRunway }
      : {}),
  });

  return workspace;
}

/**
 * @param {import('@/lib/focusSessionStorage').PersistedFocusSession} payload
 */
export function checkpointFocusSessionRemote(payload) {
  dashboardApi
    .update({ activeFocusSession: payload })
    .then(({ dashboard }) =>
      patchDashboardCache({ activeFocusSession: dashboard.activeFocusSession })
    )
    .catch(() => {});
}

export function clearFocusSessionRemote() {
  dashboardApi
    .update({ activeFocusSession: null })
    .then(() => patchDashboardCache({ activeFocusSession: undefined }))
    .catch(() => {});
}

/**
 * @param {import('@/lib/deepWorkSessionStorage').PersistedDeepWorkSession} payload
 */
export function checkpointDeepWorkSessionRemote(payload) {
  dashboardApi
    .update({ activeDeepWorkSession: payload })
    .then(({ dashboard }) =>
      patchDashboardCache({ activeDeepWorkSession: dashboard.activeDeepWorkSession })
    )
    .catch(() => {});
}

export function clearDeepWorkSessionRemote() {
  dashboardApi
    .update({ activeDeepWorkSession: null })
    .then(() => patchDashboardCache({ activeDeepWorkSession: undefined }))
    .catch(() => {});
}

/**
 * @param {import('@/lib/batchSprintStorage').PersistedBatchSprint} sprint
 */
export function checkpointBatchSprintRemote(sprint) {
  const payload = { ...sprint, updatedAt: Date.now() };
  dashboardApi
    .update({ activeBatchSprint: payload })
    .then(({ dashboard }) =>
      patchDashboardCache({ activeBatchSprint: dashboard.activeBatchSprint })
    )
    .catch(() => {});
}

export function clearBatchSprintRemote() {
  dashboardApi
    .update({ activeBatchSprint: null })
    .then(() => patchDashboardCache({ activeBatchSprint: undefined }))
    .catch(() => {});
}

/**
 * @param {import('@/lib/workspaceReconciliation').PomodoroTimerState} state
 */
export function checkpointPomodoroTimerRemote(state) {
  const payload = { ...state, updatedAt: Date.now() };
  dashboardApi
    .update({ activePomodoroTimer: payload })
    .then(({ dashboard }) =>
      patchDashboardCache({ activePomodoroTimer: dashboard.activePomodoroTimer })
    )
    .catch(() => {});
}

export function clearPomodoroTimerRemote() {
  dashboardApi
    .update({ activePomodoroTimer: null })
    .then(() => patchDashboardCache({ activePomodoroTimer: undefined }))
    .catch(() => {});
}

/**
 * @param {import('@/lib/workspaceReconciliation').TimeBlockRunwayState} runway
 */
export function checkpointTimeBlockRunwayRemote(runway) {
  const payload = { ...runway, updatedAt: Date.now() };
  dashboardApi
    .update({ activeTimeBlockRunway: payload })
    .then(({ dashboard }) =>
      patchDashboardCache({ activeTimeBlockRunway: dashboard.activeTimeBlockRunway })
    )
    .catch(() => {});
}

export function clearTimeBlockRunwayRemote() {
  dashboardApi
    .update({ activeTimeBlockRunway: null })
    .then(() => patchDashboardCache({ activeTimeBlockRunway: undefined }))
    .catch(() => {});
}
