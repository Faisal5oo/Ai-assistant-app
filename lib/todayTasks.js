/** @type {Record<import('@/types/interfaces').TaskStatus, number>} */
export const TODAY_STATUS_RANK = {
  "In-Progress": 0,
  Todo: 1,
  Completed: 2,
};

export const TODAY_MAX_TASKS = 8;

/**
 * In-Progress tasks preserve column sortOrder (index 0 = top focus candidate).
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {{ max?: number } | number} [options]
 * @returns {import('@/types/interfaces').Task[]}
 */
export function getTodayDisplayTasks(tasks, options = {}) {
  const { max = TODAY_MAX_TASKS } =
    typeof options === "number" ? { max: options } : options;

  const inProgress = tasks.filter((t) => t.status === "In-Progress");
  const todo = tasks.filter((t) => t.status === "Todo");
  const completed = tasks.filter((t) => t.status === "Completed");

  return [...inProgress, ...todo, ...completed].slice(0, max);
}

/**
 * Default Play target — index 0 of In-Progress, else first actionable task.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {import('@/types/interfaces').Task | null}
 */
export function getTopTodayTask(tasks) {
  const inProgressTop = tasks.find((t) => t.status === "In-Progress");
  if (inProgressTop) return inProgressTop;
  return tasks.find((t) => t.status !== "Completed") ?? null;
}
