import { resolveEisenhowerQuadrant } from "@/lib/eisenhower";

/**
 * Score and return top 3 uncompleted tasks for flow launch deck.
 * Prioritizes Eisenhower Q1 and active batching cluster tags.
 *
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {string | null} batchingFilterTag
 * @returns {import('@/types/interfaces').Task[]}
 */
export function selectTopFlowTargets(tasks, batchingFilterTag) {
  const active = tasks.filter((t) => t.status !== "Completed");
  if (active.length === 0) return [];

  const batchTag =
    batchingFilterTag?.trim().toLowerCase() ||
    active
      .filter((t) => t.status === "In-Progress" && t.tags.length > 0)
      .flatMap((t) => t.tags.map((tg) => tg.toLowerCase()))[0] ||
    null;

  const scoreTask = (task) => {
    let score = 0;
    const quadrant = resolveEisenhowerQuadrant(task);
    if (quadrant === 1) score += 100;
    if (task.status === "In-Progress") score += 50;
    if (task.priority === "High") score += 25;
    if (task.priority === "Medium") score += 10;
    if (
      batchTag &&
      task.tags.some((tg) => tg.toLowerCase() === batchTag)
    ) {
      score += 80;
    }
    return score;
  };

  return [...active]
    .sort((a, b) => scoreTask(b) - scoreTask(a))
    .slice(0, 3);
}

/**
 * @param {number} minutes
 * @returns {string}
 */
export function formatFlowDurationLabel(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hr`;
  return `${h}h ${m}m`;
}
