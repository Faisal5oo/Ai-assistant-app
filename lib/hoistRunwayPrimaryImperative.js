import { tasksApi } from "@/lib/api-client";
import {
  buildHoistInProgressPayload,
  applyHoistInProgress,
  getInProgressTopTask,
} from "@/lib/focusQueue";
import { getTasksFromCache, setTasksInCache } from "@/lib/query-cache";
import { getRunwayPrimaryAllocation } from "@/lib/runway-focus";

/**
 * Hoist the live runway primary task to In-Progress index 0 without starting the timer.
 * @param {number} hour
 * @returns {Promise<boolean>}
 */
export async function hoistRunwayPrimaryImperative(hour) {
  const tasks = getTasksFromCache();
  const primary = getRunwayPrimaryAllocation(tasks, hour);
  if (!primary) return false;

  const inProgressTop = getInProgressTopTask(tasks);
  if (inProgressTop?.id === primary.task.id) return true;

  const { reorder } = buildHoistInProgressPayload(tasks, primary.task.id);
  if (!reorder) return true;

  const previous = tasks;
  const nextTasks = applyHoistInProgress(tasks, reorder);
  setTasksInCache(nextTasks);

  try {
    await tasksApi.reorder(reorder);
    return true;
  } catch {
    setTasksInCache(previous);
    return false;
  }
}
