import { getQueryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import {
  addToDailyLogCache,
  getDailyLogsFromCache,
  patchDashboardCache,
} from "@/lib/query-cache";
import { todayKey } from "@/lib/utils";
import {
  estimatedMinutesToMs,
  isUnsetActualTime,
} from "@/lib/task-completion-time";

/**
 * @param {import('@/types/interfaces').Task | undefined} task
 * @param {import('@/types/interfaces').TaskStatus} nextStatus
 * @returns {number}
 */
export function optimisticCompletionTimeMs(task, nextStatus) {
  if (!task || nextStatus !== "Completed" || task.status === "Completed") return 0;
  if (!isUnsetActualTime(task.actualTimeSpent)) return 0;
  return estimatedMinutesToMs(task.estimatedTime);
}

/**
 * @param {import('@/types/interfaces').Task | undefined} prevTask
 * @param {import('@/types/interfaces').Task | undefined} nextTask
 * @returns {number}
 */
export function completionTimeCreditDelta(prevTask, nextTask) {
  if (!prevTask || !nextTask) return 0;
  if (prevTask.status === "Completed" || nextTask.status !== "Completed") return 0;

  const measuredDelta = nextTask.actualTimeSpent - (prevTask.actualTimeSpent ?? 0);
  if (measuredDelta > 0) return measuredDelta;

  return optimisticCompletionTimeMs(prevTask, nextTask.status);
}

/**
 * @param {number} deltaMs
 * @param {string} [date]
 */
export function patchDashboardForCompletionCredit(deltaMs, date = todayKey()) {
  if (deltaMs <= 0) return;

  patchDashboardCache({
    dailyLogs: addToDailyLogCache(getDailyLogsFromCache(), date, deltaMs),
  });
}

export function invalidateCompletionAnalytics() {
  const qc = getQueryClient();
  qc.invalidateQueries({ queryKey: ["analytics"] });
}

/**
 * @param {import('@/types/interfaces').Task | undefined} prevTask
 * @param {import('@/types/interfaces').Task | undefined} nextTask
 * @param {import('@/types/interfaces').DailyTimeLog[] | null | undefined} [dailyLogs]
 * @param {{ optimisticDashboardAlreadyPatched?: boolean }} [options]
 */
export function syncCompletionTimeCaches(
  prevTask,
  nextTask,
  dailyLogs,
  { optimisticDashboardAlreadyPatched = false } = {}
) {
  const transitionedToCompleted =
    prevTask?.status !== "Completed" && nextTask?.status === "Completed";

  if (!transitionedToCompleted) return;

  if (dailyLogs) {
    patchDashboardCache({ dailyLogs });
  } else if (!optimisticDashboardAlreadyPatched) {
    patchDashboardForCompletionCredit(completionTimeCreditDelta(prevTask, nextTask));
  }

  invalidateCompletionAnalytics();
}

/**
 * @param {import('@/types/interfaces').Task[]} previousTasks
 * @param {import('@/types/interfaces').Task[]} nextTasks
 */
export function syncBulkCompletionTimeCaches(previousTasks, nextTasks) {
  const previousById = new Map(previousTasks.map((task) => [task.id, task]));
  let totalDelta = 0;

  for (const nextTask of nextTasks) {
    const prevTask = previousById.get(nextTask.id);
    totalDelta += completionTimeCreditDelta(prevTask, nextTask);
  }

  if (totalDelta > 0) {
    patchDashboardForCompletionCredit(totalDelta);
  }

  const completedTransition = nextTasks.some((nextTask) => {
    const prevTask = previousById.get(nextTask.id);
    return prevTask?.status !== "Completed" && nextTask.status === "Completed";
  });

  if (completedTransition) {
    invalidateCompletionAnalytics();
  }
}
