import { getActiveTimeBlockTaskIds } from "@/lib/timeBlocking";
import { getRunwayPrimaryAllocation } from "@/lib/runway-focus";

/** @type {Record<import('@/types/interfaces').TaskStatus, number>} */
export const TODAY_STATUS_RANK = {
  "In-Progress": 0,
  Todo: 1,
  Completed: 2,
};

export const TODAY_MAX_TASKS = 8;

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {number} currentHour
 * @returns {import('@/types/interfaces').Task[]}
 */
function pinActiveTimeBlockTasks(tasks, currentHour) {
  const liveIds = getActiveTimeBlockTaskIds(tasks, currentHour);
  if (liveIds.size === 0) return tasks;

  const live = [];
  const rest = [];

  for (const task of tasks) {
    if (liveIds.has(task.id)) live.push(task);
    else rest.push(task);
  }

  return [...live, ...rest];
}

/**
 * In-Progress tasks preserve column sortOrder (index 0 = top focus candidate).
 * Active runway tasks for the current hour are pinned to the top.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {{ max?: number, currentHour?: number } | number} [options]
 * @returns {import('@/types/interfaces').Task[]}
 */
export function getTodayDisplayTasks(tasks, options = {}) {
  const { max = TODAY_MAX_TASKS, currentHour = new Date().getHours() } =
    typeof options === "number" ? { max: options } : options;

  const inProgress = tasks.filter((t) => t.status === "In-Progress");
  const todo = tasks.filter((t) => t.status === "Todo");
  const completed = tasks.filter((t) => t.status === "Completed");

  const ordered = pinActiveTimeBlockTasks(
    [...inProgress, ...todo, ...completed],
    currentHour
  );

  return ordered.slice(0, max);
}

/**
 * Default Play target — index 0 of In-Progress, else first actionable task.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {import('@/types/interfaces').Task | null}
 */
export function getTopTodayTask(tasks, currentHour = new Date().getHours()) {
  const runwayPrimary = getRunwayPrimaryAllocation(tasks, currentHour);
  if (runwayPrimary) return runwayPrimary.task;

  const inProgressTop = tasks.find((t) => t.status === "In-Progress");
  if (inProgressTop) return inProgressTop;
  return tasks.find((t) => t.status !== "Completed") ?? null;
}
