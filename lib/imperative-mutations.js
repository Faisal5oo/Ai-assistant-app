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
import { purgeDeepWorkSessionStorage } from "@/lib/deepWorkSessionStorage";
import { applyColumnReorder } from "@/lib/kanbanDragUtils";
import {
  buildHoistInProgressPayload,
  applyHoistInProgress,
} from "@/lib/focusQueue";
import { appToast } from "@/lib/toast";
import {
  computeAllocationPlan,
  getEffectiveAllocations,
  getTaskRemainingMinutes,
  upsertAllocation,
  removeAllocation,
  deriveScheduledAtFromAllocations,
} from "@/lib/time-block-allocations";
import { todayKey } from "@/lib/utils";

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
            timeBlockAllocations: [],
            scheduledAt: undefined,
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

/**
 * @param {{ taskId: string, objective: string, plannedDurationMinutes: number }} payload
 */
export async function startDeepWorkSessionImperative(payload) {
  const previousTasks = getTasksFromCache();
  const hoist = buildHoistInProgressPayload(previousTasks, payload.taskId);
  const reorder = hoist?.reorder ?? null;

  let nextTasks = applyHoistInProgress(previousTasks, reorder);
  nextTasks = nextTasks.map((t) =>
    t.id === payload.taskId
      ? {
          ...t,
          status: "In-Progress",
          lastWorkedAt: new Date().toISOString(),
        }
      : t
  );
  setTasksInCache(nextTasks);

  try {
    if (reorder) {
      await tasksApi.reorder(reorder);
    }
    const result = await productivityApi.startDeepWorkSession(payload);
    if (result.task) {
      setTasksInCache((tasks) =>
        tasks.map((t) => (t.id === result.task.id ? result.task : t))
      );
    }
    return result;
  } catch (error) {
    setTasksInCache(previousTasks);
    appToast.error(error, "Could not commit deep work session.");
    throw error;
  }
}

/**
 * @param {{
 *   taskId?: string | null;
 *   objective: string;
 *   plannedDurationMinutes: number;
 *   actualDurationMinutes: number;
 *   objectiveAchieved: boolean;
 *   status: import('@/types/interfaces').DeepWorkSessionStatus;
 *   sessionStartedAt?: string;
 *   abandonReason?: import('@/types/interfaces').DeepWorkAbandonReason;
 *   completedEarly?: boolean;
 *   minutesSaved?: number;
 *   completeTask?: boolean;
 * }} payload
 */
export async function endDeepWorkSessionImperative(payload) {
  const qc = getQueryClient();
  const previousTasks = getTasksFromCache();
  const previousDashboard = qc.getQueryData(queryKeys.dashboard);
  const durationMs = Math.round(payload.actualDurationMinutes * 60_000);

  if (payload.taskId && (durationMs > 0 || payload.completeTask)) {
    setTasksInCache((tasks) =>
      tasks.map((t) => {
        if (t.id !== payload.taskId) return t;
        return {
          ...t,
          ...(durationMs > 0
            ? {
                actualTimeSpent: t.actualTimeSpent + durationMs,
                lastWorkedAt: new Date().toISOString(),
              }
            : { lastWorkedAt: new Date().toISOString() }),
          ...(payload.completeTask
            ? {
                status: "Completed",
                completedAt: new Date().toISOString(),
                timeBlockAllocations: [],
                scheduledAt: undefined,
              }
            : {}),
        };
      })
    );

    patchDashboardCache({
      dailyLogs: addToDailyLogCache(
        getDailyLogsFromCache(),
        new Date().toISOString().slice(0, 10),
        durationMs
      ),
    });
  }

  try {
    const result = await productivityApi.endDeepWorkSession(payload);

    if (result.task) {
      setTasksInCache((tasks) =>
        tasks.map((t) => (t.id === result.task.id ? result.task : t))
      );
    }

    if (result.dailyLogs || result.deepWorkDaily) {
      patchDashboardCache({
        ...(result.dailyLogs ? { dailyLogs: result.dailyLogs } : {}),
        ...(result.deepWorkDaily ? { deepWorkDaily: result.deepWorkDaily } : {}),
        activeDeepWorkSession: undefined,
      });
    } else {
      patchDashboardCache({ activeDeepWorkSession: undefined });
    }

    qc.invalidateQueries({ queryKey: queryKeys.productivitySummary });
    if (payload.completeTask) {
      qc.invalidateQueries({ queryKey: queryKeys.analytics("week") });
      qc.invalidateQueries({ queryKey: queryKeys.analytics("month") });
    }

    purgeDeepWorkSessionStorage();

    return result;
  } catch (error) {
    setTasksInCache(previousTasks);
    if (previousDashboard) {
      qc.setQueryData(queryKeys.dashboard, previousDashboard);
    }
    appToast.error(error, "Could not finalize deep work session.");
    throw error;
  }
}

/**
 * @param {string} taskId
 * @param {number} hour
 */
export async function allocateTimeBlockImperative(taskId, hour) {
  const previous = getTasksFromCache();
  const tasks = getTasksFromCache();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;

  const dateKey = todayKey();
  const plan = computeAllocationPlan(task, hour, tasks, dateKey);

  if (!plan.ok) {
    if (plan.reason === "over_capacity") {
      const nextLabel =
        plan.nextHour != null ? `Try the ${plan.nextHour}:00 block instead.` : "";
      appToast.error(
        new Error(
          `This hour is over capacity (${plan.slotUsed}/60m). ${nextLabel}`.trim()
        ),
        "Slot over capacity"
      );
    } else {
      appToast.error(
        new Error("This task is already fully allocated."),
        "Fully allocated"
      );
    }
    return null;
  }

  const nextAllocation = {
    date: dateKey,
    hour,
    durationMinutes: plan.durationMinutes,
  };

  const baseAllocations = (task.timeBlockAllocations ?? []).length
    ? [...(task.timeBlockAllocations ?? [])]
    : getEffectiveAllocations(task, dateKey).map((a) => ({ ...a }));

  const updatedAllocations = upsertAllocation(baseAllocations, nextAllocation);
  const scheduledAt = deriveScheduledAtFromAllocations(
    updatedAllocations,
    dateKey
  );

  setTasksInCache((list) =>
    list.map((t) =>
      t.id === taskId
        ? {
            ...t,
            timeBlockAllocations: updatedAllocations,
            ...(scheduledAt ? { scheduledAt } : {}),
          }
        : t
    )
  );

  try {
    const result = await productivityApi.allocateBlock({ taskId, hour });
    setTasksInCache((list) =>
      list.map((t) => (t.id === result.task.id ? result.task : t))
    );
    return result;
  } catch (error) {
    setTasksInCache(previous);
    if (error.status === 409) {
      appToast.error(error, "Slot over capacity");
    } else {
      appToast.error(error, "Could not allocate time block.");
    }
    throw error;
  }
}

/**
 * @param {string} taskId
 * @param {number} hour
 */
export async function deallocateTimeBlockImperative(taskId, hour) {
  const previous = getTasksFromCache();
  const task = getTasksFromCache().find((t) => t.id === taskId);
  if (!task) return null;

  const dateKey = todayKey();
  const updatedAllocations = removeAllocation(
    task.timeBlockAllocations ?? getEffectiveAllocations(task, dateKey),
    dateKey,
    hour
  );
  const scheduledAt = deriveScheduledAtFromAllocations(
    updatedAllocations,
    dateKey
  );

  setTasksInCache((list) =>
    list.map((t) =>
      t.id === taskId
        ? {
            ...t,
            timeBlockAllocations: updatedAllocations,
            scheduledAt: scheduledAt ?? null,
          }
        : t
    )
  );

  try {
    const result = await productivityApi.deallocateBlock({ taskId, hour });
    setTasksInCache((list) =>
      list.map((t) => (t.id === result.task.id ? result.task : t))
    );
    return result;
  } catch (error) {
    setTasksInCache(previous);
    appToast.error(error, "Could not remove time block.");
    throw error;
  }
}

/**
 * @param {string} taskId
 * @param {string | null} batchCategory
 */
export async function updateBatchCategoryImperative(taskId, batchCategory) {
  const previous = getTasksFromCache();

  setTasksInCache((tasks) =>
    tasks.map((t) => {
      if (t.id !== taskId) return t;
      if (!batchCategory) {
        const { batchCategory: _removed, ...rest } = t;
        return rest;
      }
      return { ...t, batchCategory };
    })
  );

  try {
    const { task } = await productivityApi.updateBatchCategory({
      taskId,
      batchCategory,
    });
    setTasksInCache((tasks) =>
      tasks.map((t) => {
        if (t.id !== task.id) return t;
        const resolvedCategory =
          task.batchCategory ?? batchCategory ?? t.batchCategory;
        if (!resolvedCategory) {
          const { batchCategory: _removed, ...rest } = { ...t, ...task };
          return rest;
        }
        return { ...t, ...task, batchCategory: resolvedCategory };
      })
    );
    return task;
  } catch (error) {
    setTasksInCache(previous);
    appToast.error(error, "Could not update batch category.");
    throw error;
  }
}

/**
 * @param {{
 *   batchCategory: string;
 *   bucketTitle: string;
 *   sessionStartedAt: string;
 *   durationMs: number;
 *   tasksTotal: number;
 *   tasksCompleted: number;
 *   tasksSkipped: number;
 *   focusEfficiency: number;
 *   status: 'completed' | 'abandoned';
 * }} payload
 */
export async function endBatchSprintImperative(payload) {
  const qc = getQueryClient();

  try {
    const result = await productivityApi.endBatchSprint(payload);
    qc.invalidateQueries({ queryKey: queryKeys.productivitySummary });
    return result;
  } catch (error) {
    appToast.error(error, "Could not save batch sprint record.");
    throw error;
  }
}
