import { tasksApi, dashboardApi } from "@/lib/api-client";
import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  setTasksInCache,
  patchDashboardCache,
  addToDailyLogCache,
  getTasksFromCache,
  getDailyLogsFromCache,
  getPomodoroDailyFromCache,
} from "@/lib/query-cache";
import { applyColumnReorder } from "@/lib/kanbanDragUtils";
import { appToast } from "@/lib/toast";

/** @param {Record<string, unknown>} updates */
function toApiTaskUpdates(updates) {
  const payload = { ...updates };
  if (payload.scheduledAt === undefined && "scheduledAt" in updates) {
    payload.scheduledAt = null;
  }
  return payload;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} updates
 * @param {{ silent?: boolean }} [options]
 */
export async function updateTaskImperative(id, updates, options = {}) {
  const { silent = true } = options;
  const previous = getTasksFromCache();

  setTasksInCache((tasks) =>
    tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
  );

  try {
    const { task } = await tasksApi.update(id, toApiTaskUpdates(updates));
    setTasksInCache((tasks) =>
      tasks.map((t) => (t.id === task.id ? task : t))
    );
    return task;
  } catch (error) {
    setTasksInCache(previous);
    if (!silent) appToast.error(error, "Could not update task.");
    throw error;
  }
}

/**
 * @param {string} id
 * @param {number} durationMs
 * @param {string} date
 */
export async function recordTaskTimeImperative(id, durationMs, date) {
  const qc = getQueryClient();
  const previousTasks = getTasksFromCache();
  const previousDashboard = qc.getQueryData(queryKeys.dashboard);

  setTasksInCache((tasks) =>
    tasks.map((t) =>
      t.id === id
        ? { ...t, actualTimeSpent: t.actualTimeSpent + durationMs }
        : t
    )
  );

  patchDashboardCache({
    dailyLogs: addToDailyLogCache(getDailyLogsFromCache(), date, durationMs),
  });

  try {
    const result = await tasksApi.recordTime(id, durationMs, date);
    setTasksInCache((tasks) =>
      tasks.map((t) => (t.id === result.task.id ? result.task : t))
    );
    patchDashboardCache({ dailyLogs: result.dailyLogs });
    return result;
  } catch (error) {
    setTasksInCache(previousTasks);
    if (previousDashboard) {
      qc.setQueryData(queryKeys.dashboard, previousDashboard);
    }
    appToast.error(error, "Could not record time.");
    throw error;
  }
}

/**
 * @param {{ date: string, goal?: number }} payload
 */
export async function incrementPomodoroImperative(payload) {
  const qc = getQueryClient();
  const previous = qc.getQueryData(queryKeys.dashboard);
  const current = getPomodoroDailyFromCache();

  const pomodoroDaily =
    current.date !== payload.date
      ? { date: payload.date, completed: 1, goal: payload.goal ?? current.goal ?? 4 }
      : { ...current, completed: current.completed + 1 };

  patchDashboardCache({ pomodoroDaily });

  try {
    const { dashboard } = await dashboardApi.update({
      pomodoroIncrement: payload,
    });
    qc.setQueryData(queryKeys.dashboard, dashboard);
    return dashboard;
  } catch (error) {
    if (previous) qc.setQueryData(queryKeys.dashboard, previous);
    appToast.error(error, "Could not update pomodoro progress.");
    throw error;
  }
}

/**
 * @param {{
 *   columnId: import('@/types/interfaces').TaskStatus;
 *   taskIds: string[];
 *   sourceColumnId?: import('@/types/interfaces').TaskStatus;
 *   sourceTaskIds?: string[];
 * }} payload
 */
export async function reorderTasksImperative(payload) {
  const previous = getTasksFromCache();

  setTasksInCache((tasks) =>
    applyColumnReorder(tasks, payload.columnId, payload.taskIds)
  );

  try {
    await tasksApi.reorder(payload);
  } catch (error) {
    setTasksInCache(previous);
    appToast.error(error, "Could not reorder tasks.");
  }
}

/**
 * @param {string} id
 */
export async function deleteTaskImperative(id) {
  const previous = getTasksFromCache();
  setTasksInCache((tasks) => tasks.filter((t) => t.id !== id));

  try {
    await tasksApi.remove(id);
  } catch (error) {
    setTasksInCache(previous);
    appToast.error(error, "Could not delete task.");
  }
}
