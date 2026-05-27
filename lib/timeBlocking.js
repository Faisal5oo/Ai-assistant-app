import { format, parseISO, setHours, setMinutes, setSeconds, startOfDay } from "date-fns";
import { isScheduledToday } from "@/lib/utils";

export const HOURS_PER_DAY = 24;

/** @typedef {{ id: string, title: string, startHour: number, endHour: number, defaultExpanded: boolean }} TimelineSectionConfig */

/** @type {TimelineSectionConfig[]} */
export const TIMELINE_SECTIONS = [
  {
    id: "early",
    title: "Night & Early Morning",
    startHour: 0,
    endHour: 6,
    defaultExpanded: false,
  },
  {
    id: "core",
    title: "Core Active Runway",
    startHour: 6,
    endHour: 18,
    defaultExpanded: true,
  },
  {
    id: "evening",
    title: "Evening & Night Recovery",
    startHour: 18,
    endHour: 24,
    defaultExpanded: true,
  },
];

/** @returns {number[]} */
export function getAllDayHourSlots() {
  return Array.from({ length: HOURS_PER_DAY }, (_, i) => i);
}

/**
 * @param {number} hour24
 * @returns {string}
 */
export function formatHourLabel(hour24) {
  const date = setMinutes(setHours(new Date(), hour24 % 24), 0);
  return format(date, "h:mm a");
}

/**
 * @param {number} hour24
 * @returns {string}
 */
export function formatHourRangeLabel(hour24) {
  const start = formatHourLabel(hour24);
  const end = formatHourLabel((hour24 + 1) % 24);
  return `${start} – ${end}`;
}

/**
 * @param {TimelineSectionConfig} section
 * @returns {string}
 */
export function formatSectionRangeLabel(section) {
  const start = formatHourLabel(section.startHour);
  const end = formatHourLabel(section.endHour % 24);
  return `${start} – ${end}`;
}

/**
 * @param {number} hour24
 * @returns {string}
 */
export function buildSlotIsoForToday(hour24) {
  const base = startOfDay(new Date());
  return setSeconds(setMinutes(setHours(base, hour24), 0), 0).toISOString();
}

/**
 * @param {import('@/types/interfaces').Task} task
 * @returns {number | null}
 */
export function getTaskSlotHour(task) {
  if (!task.scheduledAt || !isScheduledToday(task.scheduledAt)) return null;
  return parseISO(task.scheduledAt).getHours();
}

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {Record<number, import('@/types/interfaces').Task | null>}
 */
export function buildSlotAssignmentMap(tasks) {
  /** @type {Record<number, import('@/types/interfaces').Task | null>} */
  const map = {};
  for (const hour of getAllDayHourSlots()) {
    map[hour] = null;
  }

  for (const task of tasks) {
    if (task.status === "Completed") continue;
    const hour = getTaskSlotHour(task);
    if (hour === null || hour < 0 || hour >= HOURS_PER_DAY) continue;

    if (!map[hour]) {
      map[hour] = task;
      continue;
    }

    const existing = map[hour];
    const existingMin = existing?.scheduledAt
      ? parseISO(existing.scheduledAt).getMinutes()
      : 0;
    const taskMin = parseISO(task.scheduledAt).getMinutes();
    if (taskMin < existingMin) {
      map[hour] = task;
    }
  }

  return map;
}

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {Record<number, import('@/types/interfaces').Task | null>} slotMap
 * @returns {import('@/types/interfaces').Task[]}
 */
export function getUnassignedTasks(tasks, slotMap) {
  const assignedIds = new Set(
    Object.values(slotMap)
      .filter(Boolean)
      .map((t) => t.id)
  );

  return tasks.filter(
    (t) => t.status !== "Completed" && !assignedIds.has(t.id)
  );
}

/**
 * @param {Date} now
 * @returns {number}
 */
export function getCurrentHour(now) {
  return now.getHours();
}

/**
 * @param {Date} now
 * @returns {number} 0–1 progress through the current hour
 */
export function getHourProgress(now) {
  return (now.getMinutes() * 60 + now.getSeconds()) / 3600;
}

/**
 * @param {TimelineSectionConfig} section
 * @returns {number[]}
 */
export function getSectionHours(section) {
  const hours = [];
  for (let h = section.startHour; h < section.endHour; h += 1) {
    hours.push(h);
  }
  return hours;
}

/**
 * Shared layout id so tasks morph between scratchpad and runway.
 * @param {string} taskId
 * @returns {string}
 */
export function taskLayoutId(taskId) {
  return `time-block-task-${taskId}`;
}
