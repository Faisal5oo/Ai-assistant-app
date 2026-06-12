import { tasksApi, dashboardApi, productivityApi } from "@/lib/api-client";
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
 * @param {{ startedAt?: string, stoppedAt?: string }} [interval]
 */
export async function recordTaskTimeImperative(id, durationMs, date, interval = {}) {
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
    const result = await tasksApi.recordTime(id, durationMs, date, interval);
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

/**
 * @param {{ taskId?: string | null, type?: import('@/types/interfaces').PomodoroSessionType, plannedDurationMinutes?: number }} payload
 */
export async function startPomodoroSessionImperative(payload) {
  const previousTasks = getTasksFromCache();

  if (payload.taskId) {
    setTasksInCache((tasks) =>
      tasks.map((t) =>
        t.id === payload.taskId
          ? {
              ...t,
              status: "In-Progress",
              lastWorkedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }

  try {
    const result = await productivityApi.startSession(payload);
    if (result.task) {
      setTasksInCache((tasks) =>
        tasks.map((t) => (t.id === result.task.id ? result.task : t))
      );
    }
    return result;
  } catch (error) {
    setTasksInCache(previousTasks);
    appToast.error(error, "Could not start focus session.");
    throw error;
  }
}

/**
 * @param {{
 *   taskId?: string | null;
 *   type: import('@/types/interfaces').PomodoroSessionType;
 *   duration: number;
 *   status: import('@/types/interfaces').PomodoroSessionStatus;
 *   sessionStartedAt?: string;
 * }} payload
 */
export async function endPomodoroSessionImperative(payload) {
  const qc = getQueryClient();
  const previousTasks = getTasksFromCache();
  const previousDashboard = qc.getQueryData(queryKeys.dashboard);
  const durationMs = Math.round(payload.duration * 60_000);
  const isCompletedFocus = payload.status === "completed" && payload.type === "focus";

  if (payload.taskId && durationMs > 0) {
    setTasksInCache((tasks) =>
      tasks.map((t) => {
        if (t.id !== payload.taskId) return t;
        return {
          ...t,
          actualTimeSpent: t.actualTimeSpent + durationMs,
          ...(isCompletedFocus
            ? { completedPomodoros: (t.completedPomodoros ?? 0) + 1 }
            : {}),
          lastWorkedAt: new Date().toISOString(),
        };
      })
    );
  }

  if (isCompletedFocus) {
    const current = getPomodoroDailyFromCache();
    const date = payload.sessionStartedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    const pomodoroDaily =
      current.date !== date
        ? { date, completed: 1, goal: current.goal ?? 4 }
        : { ...current, completed: current.completed + 1 };
    patchDashboardCache({ pomodoroDaily });
  }

  if (payload.taskId && durationMs > 0) {
    patchDashboardCache({
      dailyLogs: addToDailyLogCache(
        getDailyLogsFromCache(),
        new Date().toISOString().slice(0, 10),
        durationMs
      ),
    });
  }

  try {
    const result = await productivityApi.endSession(payload);

    if (result.task) {
      setTasksInCache((tasks) =>
        tasks.map((t) => (t.id === result.task.id ? result.task : t))
      );
    }

    if (result.dailyLogs) {
      patchDashboardCache({ dailyLogs: result.dailyLogs });
    }

    qc.invalidateQueries({ queryKey: queryKeys.productivitySummary });

    return result;
  } catch (error) {
    setTasksInCache(previousTasks);
    if (previousDashboard) {
      qc.setQueryData(queryKeys.dashboard, previousDashboard);
    }
    appToast.error(error, "Could not finalize focus session.");
    throw error;
  }
}

/**
 * @param {string} taskId
 */
export async function completeTaskImperative(taskId) {
  const previous = getTasksFromCache();

  setTasksInCache((tasks) =>
    tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: "Completed",
            completedAt: new Date().toISOString(),
          }
        : t
    )
  );

  try {
    const { task } = await productivityApi.completeTask(taskId);
    setTasksInCache((tasks) =>
      tasks.map((t) => (t.id === task.id ? task : t))
    );

    const qc = getQueryClient();
    qc.invalidateQueries({ queryKey: queryKeys.analytics("week") });
    qc.invalidateQueries({ queryKey: queryKeys.analytics("month") });
    qc.invalidateQueries({ queryKey: queryKeys.productivitySummary });

    return task;
  } catch (error) {
    setTasksInCache(previous);
    appToast.error(error, "Could not complete task.");
    throw error;
  }
}
