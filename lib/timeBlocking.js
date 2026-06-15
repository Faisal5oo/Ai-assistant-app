import { format, parseISO, setHours, setMinutes, setSeconds, startOfDay } from "date-fns";
import { isScheduledToday } from "@/lib/utils";
import {
  buildMultiSlotAssignmentMap,
  getBrainDumpTasks,
  getSlotAllocations,
  getSlotUsedMinutes,
  getTaskRemainingMinutes,
  SLOT_CAPACITY_MINUTES,
} from "@/lib/time-block-allocations";

export const HOURS_PER_DAY = 24;
export { SLOT_CAPACITY_MINUTES, getTaskRemainingMinutes, getSlotUsedMinutes, getSlotAllocations };

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
 * Multi-slot runway map — each hour holds zero or more task allocations.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {Record<number, import('@/lib/time-block-allocations').SlotAllocation[]>}
 */
export function buildSlotAssignmentMap(tasks) {
  return buildMultiSlotAssignmentMap(tasks);
}

/**
 * Tasks with remaining estimate minutes — stay in brain dump until fully blocked.
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {Record<number, import('@/lib/time-block-allocations').SlotAllocation[]>} slotMap
 * @returns {import('@/types/interfaces').Task[]}
 */
export function getUnassignedTasks(tasks, slotMap) {
  return getBrainDumpTasks(tasks, slotMap);
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

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {number} hour
 * @returns {import('@/lib/time-block-allocations').SlotAllocation[]}
 */
export function getActiveRunwayAllocations(tasks, hour) {
  return getSlotAllocations(tasks, hour);
}

/**
 * Task ids allocated to the live hour block (for dashboard runway surfacing).
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {number} [hour]
 * @returns {Set<string>}
 */
export function getActiveTimeBlockTaskIds(tasks, hour = getCurrentHour(new Date())) {
  return new Set(
    getSlotAllocations(tasks, hour).map(({ task }) => task.id)
  );
}
