import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

/**
 * @returns {import('@/types/interfaces').Task[]}
 */
export function getTasksFromCache() {
  return getQueryClient().getQueryData(queryKeys.tasks("today")) ?? [];
}

/**
 * @param {import('@/types/interfaces').Task[] | ((prev: import('@/types/interfaces').Task[]) => import('@/types/interfaces').Task[])} updater
 */
export function setTasksInCache(updater) {
  getQueryClient().setQueryData(queryKeys.tasks("today"), (prev) => {
    const current = /** @type {import('@/types/interfaces').Task[] | undefined} */ (prev) ?? [];
    return typeof updater === "function" ? updater(current) : updater;
  });
}

/**
 * @param {import('@/types/interfaces').Task[] | ((prev: import('@/types/interfaces').Task[]) => import('@/types/interfaces').Task[])} updater
 */
export function setArchivedTasksInCache(updater) {
  getQueryClient().setQueryData(queryKeys.tasks("archived"), (prev) => {
    const current = /** @type {import('@/types/interfaces').Task[] | undefined} */ (prev) ?? [];
    return typeof updater === "function" ? updater(current) : updater;
  });
}

/**
 * @returns {import('@/types/interfaces').DailyTimeLog[]}
 */
export function getDailyLogsFromCache() {
  const dashboard = getQueryClient().getQueryData(queryKeys.dashboard);
  return dashboard?.dailyLogs ?? [];
}

/**
 * @returns {import('@/types/interfaces').PomodoroDaily}
 */
export function getPomodoroDailyFromCache() {
  const dashboard = getQueryClient().getQueryData(queryKeys.dashboard);
  return (
    dashboard?.pomodoroDaily ?? {
      date: new Date().toISOString().slice(0, 10),
      completed: 0,
      goal: 4,
    }
  );
}

/**
 * @param {Partial<{ dailyLogs: import('@/types/interfaces').DailyTimeLog[], pomodoroDaily: import('@/types/interfaces').PomodoroDaily }>} patch
 */
export function patchDashboardCache(patch) {
  getQueryClient().setQueryData(queryKeys.dashboard, (prev) => ({
    dailyLogs: [],
    pomodoroDaily: { date: "", completed: 0, goal: 4 },
    ...prev,
    ...patch,
  }));
}

/** @param {import('@/types/interfaces').DailyTimeLog[]} logs @param {string} date @param {number} ms */
export function addToDailyLogCache(logs, date, ms) {
  const existing = logs.find((l) => l.date === date);
  if (existing) {
    return logs.map((l) =>
      l.date === date ? { ...l, totalMs: l.totalMs + ms } : l
    );
  }
  return [...logs, { date, totalMs: ms }];
}

/**
 * @param {import('@tanstack/react-query').QueryClient} [client]
 */
export function invalidateTasks(client) {
  const qc = client ?? getQueryClient();
  qc.invalidateQueries({ queryKey: ["tasks"] });
}

/**
 * @param {import('@tanstack/react-query').QueryClient} [client]
 */
export function invalidateDashboard(client) {
  const qc = client ?? getQueryClient();
  return qc.invalidateQueries({ queryKey: queryKeys.dashboard });
}

/**
 * @param {import('@tanstack/react-query').QueryClient} [client]
 */
export function clearAllQueries(client) {
  const qc = client ?? getQueryClient();
  qc.removeQueries();
}
