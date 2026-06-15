import { parseISO } from "date-fns";
import { isScheduledToday, todayKey } from "@/lib/utils";

export const SLOT_CAPACITY_MINUTES = 60;

/**
 * @typedef {import('@/types/interfaces').TimeBlockAllocation} TimeBlockAllocation
 * @typedef {import('@/types/interfaces').Task} Task
 * @typedef {{ task: Task, durationMinutes: number }} SlotAllocation
 */

/**
 * @param {Task} task
 * @param {string} [dateKey]
 * @returns {TimeBlockAllocation[]}
 */
export function getEffectiveAllocations(task, dateKey = todayKey()) {
  const stored = (task.timeBlockAllocations ?? []).filter((a) => a.date === dateKey);

  if (stored.length > 0) return stored;

  if (
    task.scheduledAt &&
    isScheduledToday(task.scheduledAt) &&
    task.status !== "Completed"
  ) {
    const hour = parseISO(task.scheduledAt).getHours();
    return [
      {
        date: dateKey,
        hour,
        durationMinutes: Math.min(task.estimatedTime, SLOT_CAPACITY_MINUTES),
      },
    ];
  }

  return [];
}

/**
 * @param {Task} task
 * @param {string} [dateKey]
 * @returns {number}
 */
export function getTaskAllocatedMinutes(task, dateKey = todayKey()) {
  return getEffectiveAllocations(task, dateKey).reduce(
    (sum, a) => sum + a.durationMinutes,
    0
  );
}

/**
 * @param {Task} task
 * @param {string} [dateKey]
 * @returns {number}
 */
export function getTaskRemainingMinutes(task, dateKey = todayKey()) {
  if (task.status === "Completed") return 0;
  return Math.max(0, task.estimatedTime - getTaskAllocatedMinutes(task, dateKey));
}

/**
 * @param {Task} task
 * @param {string} [dateKey]
 * @returns {boolean}
 */
export function isTaskFullyAllocated(task, dateKey = todayKey()) {
  return getTaskRemainingMinutes(task, dateKey) === 0;
}

/**
 * @param {Task[]} tasks
 * @param {number} hour
 * @param {string} [dateKey]
 * @returns {number}
 */
export function getSlotUsedMinutes(tasks, hour, dateKey = todayKey()) {
  let used = 0;

  for (const task of tasks) {
    if (task.status === "Completed") continue;

    for (const allocation of getEffectiveAllocations(task, dateKey)) {
      if (allocation.hour === hour) {
        used += allocation.durationMinutes;
      }
    }
  }

  return used;
}

/**
 * @param {Task} task
 * @param {number} hour
 * @param {Task[]} allTasks
 * @param {string} [dateKey]
 * @returns {{ ok: true, durationMinutes: number } | { ok: false, reason: 'fully_allocated' | 'over_capacity', slotUsed?: number, nextHour?: number }}
 */
export function computeAllocationPlan(task, hour, allTasks, dateKey = todayKey()) {
  const remaining = getTaskRemainingMinutes(task, dateKey);
  if (remaining <= 0) {
    return { ok: false, reason: "fully_allocated" };
  }

  const existingInHour = getTaskAllocationInHour(task, hour, dateKey);
  const slotUsed = getSlotUsedMinutes(allTasks, hour, dateKey);
  const slotUsedByOthers =
    slotUsed - (existingInHour?.durationMinutes ?? 0);
  const available = SLOT_CAPACITY_MINUTES - slotUsedByOthers;
  const proposed = Math.min(remaining, available);

  if (proposed <= 0 || slotUsedByOthers >= SLOT_CAPACITY_MINUTES) {
    return {
      ok: false,
      reason: "over_capacity",
      slotUsed,
      nextHour: findNextAvailableHour(
        allTasks,
        hour,
        Math.min(remaining, SLOT_CAPACITY_MINUTES),
        dateKey
      ),
    };
  }

  return { ok: true, durationMinutes: proposed };
}

/**
 * @param {Task[]} tasks
 * @param {number} afterHour
 * @param {number} neededMinutes
 * @param {string} [dateKey]
 * @returns {number | null}
 */
export function findNextAvailableHour(
  tasks,
  afterHour,
  neededMinutes,
  dateKey = todayKey()
) {
  const need = Math.min(neededMinutes, SLOT_CAPACITY_MINUTES);

  for (let h = afterHour + 1; h < 24; h += 1) {
    const used = getSlotUsedMinutes(tasks, h, dateKey);
    if (used + need <= SLOT_CAPACITY_MINUTES) return h;
  }

  for (let h = 0; h <= afterHour; h += 1) {
    const used = getSlotUsedMinutes(tasks, h, dateKey);
    if (used + need <= SLOT_CAPACITY_MINUTES) return h;
  }

  return null;
}

/**
 * @param {Task[]} tasks
 * @param {string} [dateKey]
 * @returns {Record<number, SlotAllocation[]>}
 */
export function buildMultiSlotAssignmentMap(tasks, dateKey = todayKey()) {
  /** @type {Record<number, SlotAllocation[]>} */
  const map = {};

  for (let h = 0; h < 24; h += 1) {
    map[h] = [];
  }

  for (const task of tasks) {
    if (task.status === "Completed") continue;

    for (const allocation of getEffectiveAllocations(task, dateKey)) {
      const hour = allocation.hour;
      if (hour < 0 || hour >= 24) continue;

      map[hour].push({
        task,
        durationMinutes: allocation.durationMinutes,
      });
    }
  }

  for (let h = 0; h < 24; h += 1) {
    map[h].sort((a, b) => a.task.title.localeCompare(b.task.title));
  }

  return map;
}

/**
 * @param {Task[]} tasks
 * @param {Record<number, SlotAllocation[]>} slotMap
 * @returns {Task[]}
 */
export function getBrainDumpTasks(tasks, slotMap) {
  void slotMap;
  return tasks.filter(
    (t) => t.status !== "Completed" && getTaskRemainingMinutes(t) > 0
  );
}

/**
 * @param {Task[]} tasks
 * @param {number} hour
 * @param {string} [dateKey]
 * @returns {SlotAllocation[]}
 */
export function getSlotAllocations(tasks, hour, dateKey = todayKey()) {
  return buildMultiSlotAssignmentMap(tasks, dateKey)[hour] ?? [];
}

/**
 * @param {Task[]} tasks
 * @param {number} hour
 * @param {string} [dateKey]
 * @returns {boolean}
 */
export function isSlotOverCapacity(tasks, hour, dateKey = todayKey()) {
  return getSlotUsedMinutes(tasks, hour, dateKey) > SLOT_CAPACITY_MINUTES;
}

/**
 * @param {Task} task
 * @param {number} hour
 * @param {string} [dateKey]
 * @returns {TimeBlockAllocation | null}
 */
export function getTaskAllocationInHour(task, hour, dateKey = todayKey()) {
  return (
    getEffectiveAllocations(task, dateKey).find((a) => a.hour === hour) ?? null
  );
}

/**
 * @param {TimeBlockAllocation[]} allocations
 * @param {string} dateKey
 * @returns {string | null}
 */
export function deriveScheduledAtFromAllocations(allocations, dateKey) {
  const todayAllocations = allocations
    .filter((a) => a.date === dateKey)
    .sort((a, b) => a.hour - b.hour);

  if (todayAllocations.length === 0) return null;

  const first = todayAllocations[0];
  const base = new Date();
  base.setHours(first.hour, 0, 0, 0);
  return base.toISOString();
}

/**
 * @param {TimeBlockAllocation[]} existing
 * @param {TimeBlockAllocation} next
 * @returns {TimeBlockAllocation[]}
 */
export function upsertAllocation(existing, next) {
  const without = existing.filter(
    (a) => !(a.date === next.date && a.hour === next.hour)
  );
  return [...without, next];
}

/**
 * @param {TimeBlockAllocation[]} existing
 * @param {string} dateKey
 * @param {number} hour
 * @returns {TimeBlockAllocation[]}
 */
export function removeAllocation(existing, dateKey, hour) {
  return existing.filter((a) => !(a.date === dateKey && a.hour === hour));
}
