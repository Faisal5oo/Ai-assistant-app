import { todayKey } from "@/lib/utils";
import { getSlotAllocations } from "@/lib/time-block-allocations";
import {
  formatHourRangeLabel,
  getActiveRunwayAllocations,
  getCurrentHour,
} from "@/lib/timeBlocking";

export const RUNWAY_ALERT_LEAD_MIN = 2;
export const RUNWAY_ALERT_LEAD_MAX = 5;

/**
 * @param {number} [durationMinutes]
 * @returns {import('@/hooks/useActivateFocusTask').ActivateFocusOptions}
 */
export function buildRunwayFocusTimerOptions(durationMinutes = 60) {
  const minutes = Math.max(1, Math.min(60, durationMinutes));
  return {
    mode: "work",
    technique: "time-blocking",
    targetMs: minutes * 60 * 1000,
  };
}

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {number} [hour]
 * @returns {{ task: import('@/types/interfaces').Task, durationMinutes: number } | null}
 */
export function getRunwayPrimaryAllocation(tasks, hour = getCurrentHour(new Date())) {
  const allocations = getActiveRunwayAllocations(tasks, hour);
  return allocations[0] ?? null;
}

/**
 * @param {Date} now
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {string} [dateKey]
 * @returns {{ hour: number, rangeLabel: string, allocations: import('@/lib/time-block-allocations').SlotAllocation[], minutesUntil: number } | null}
 */
export function getUpcomingRunwayAlert(now, tasks, dateKey = todayKey()) {
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const minutesIntoHour = minutes + seconds / 60;
  const minutesUntilNextHour = 60 - minutesIntoHour;

  if (
    minutesUntilNextHour < RUNWAY_ALERT_LEAD_MIN ||
    minutesUntilNextHour > RUNWAY_ALERT_LEAD_MAX
  ) {
    return null;
  }

  const currentHour = getCurrentHour(now);
  const nextHour = (currentHour + 1) % 24;
  const allocations = getSlotAllocations(tasks, nextHour, dateKey);

  if (allocations.length === 0) return null;

  return {
    hour: nextHour,
    rangeLabel: formatHourRangeLabel(nextHour),
    allocations,
    minutesUntil: Math.round(minutesUntilNextHour),
  };
}

/**
 * @param {string} dateKey
 * @param {number} hour
 * @returns {string}
 */
export function runwayAlertStorageKey(dateKey, hour) {
  return `runway-block-alert:${dateKey}:${hour}`;
}
