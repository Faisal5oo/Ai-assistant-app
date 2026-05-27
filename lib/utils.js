import { format, formatDuration, intervalToDuration, parseISO, startOfDay, isToday } from "date-fns";

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatMsToTimer(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatMsToHoursMinutes(ms) {
  const duration = intervalToDuration({ start: 0, end: ms });
  const h = duration.hours ?? 0;
  const m = duration.minutes ?? 0;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * @param {number} ms
 * @returns {number}
 */
export function msToHours(ms) {
  return ms / (1000 * 60 * 60);
}

/**
 * @param {string} dateStr - yyyy-MM-dd
 * @returns {string}
 */
export function formatDateLabel(dateStr) {
  return format(parseISO(dateStr), "MMM d");
}

/**
 * @returns {string}
 */
export function todayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @returns {number}
 */
export function calculateFocusScore(tasks) {
  if (tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t.status === "Completed");
  const completionRate = completed.length / tasks.length;

  const withEstimate = tasks.filter((t) => t.estimatedTime > 0 && t.actualTimeSpent > 0);
  let accuracyScore = 0.5;
  if (withEstimate.length > 0) {
    const accuracies = withEstimate.map((t) => {
      const estimatedMs = t.estimatedTime * 60 * 1000;
      const ratio = t.actualTimeSpent / estimatedMs;
      const deviation = Math.abs(1 - ratio);
      return Math.max(0, 1 - deviation);
    });
    accuracyScore = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  }

  const highPriorityDone = tasks.filter(
    (t) => t.priority === "High" && t.status === "Completed"
  ).length;
  const highPriorityTotal = tasks.filter((t) => t.priority === "High").length || 1;
  const priorityScore = highPriorityDone / highPriorityTotal;

  return Math.round((completionRate * 0.45 + accuracyScore * 0.35 + priorityScore * 0.2) * 100);
}

/**
 * @param {string} [iso]
 * @returns {boolean}
 */
export function isScheduledToday(iso) {
  if (!iso) return false;
  return isToday(parseISO(iso));
}

/**
 * @param {string} iso
 * @returns {string}
 */
export function formatScheduledTime(iso) {
  return format(parseISO(iso), "h:mm a");
}

/**
 * @param {string} iso
 * @returns {number}
 */
export function getHourFromIso(iso) {
  return parseISO(iso).getHours() + parseISO(iso).getMinutes() / 60;
}

export { format, startOfDay };
