import { applyColumnReorder } from "@/lib/kanbanDragUtils";

/** @param {import('@/types/interfaces').Task[]} tasks */
export function getInProgressTasks(tasks) {
  return tasks.filter((t) => t.status === "In-Progress");
}

/**
 * Index 0 of the In-Progress column — default Play target.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {import('@/types/interfaces').Task | null}
 */
export function getInProgressTopTask(tasks) {
  return getInProgressTasks(tasks)[0] ?? null;
}

/**
 * Build reorder payload to hoist a task to index 0 in In-Progress.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {string} focusTaskId
 */
export function buildHoistInProgressPayload(tasks, focusTaskId) {
  const task = tasks.find((t) => t.id === focusTaskId);
  if (!task) return null;

  const inProgress = getInProgressTasks(tasks);
  const restIds = inProgress
    .filter((t) => t.id !== focusTaskId)
    .map((t) => t.id);
  const taskIds = [focusTaskId, ...restIds];

  if (task.status === "In-Progress") {
    const alreadyTop = inProgress[0]?.id === focusTaskId;
    if (alreadyTop) return { reorder: null, alreadyTop: true };
    return {
      reorder: { columnId: "In-Progress", taskIds },
      alreadyTop: false,
    };
  }

  const sourceColumnId = task.status;
  const sourceTaskIds = tasks
    .filter((t) => t.status === sourceColumnId && t.id !== focusTaskId)
    .map((t) => t.id);

  return {
    reorder: {
      columnId: "In-Progress",
      taskIds,
      sourceColumnId,
      sourceTaskIds,
    },
    alreadyTop: false,
  };
}

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {{ columnId: string; taskIds: string[]; sourceColumnId?: string; sourceTaskIds?: string[] } | null} reorder
 */
export function applyHoistInProgress(tasks, reorder) {
  if (!reorder) return tasks;
  return applyColumnReorder(tasks, reorder.columnId, reorder.taskIds);
}
