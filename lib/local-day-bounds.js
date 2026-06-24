/**
 * Calendar-day bounds for a user's local timezone.
 *
 * @param {string} dateKey - yyyy-MM-dd in the user's local calendar
 * @param {number} tzOffsetMinutes - `Date.getTimezoneOffset()` (positive west of UTC)
 * @returns {{ start: Date, end: Date }}
 */
export function localDayBounds(dateKey, tzOffsetMinutes) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const startMs =
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) + tzOffsetMinutes * 60 * 1000;
  const endMs = startMs + 24 * 60 * 60 * 1000 - 1;

  return {
    start: new Date(startMs),
    end: new Date(endMs),
  };
}

/**
 * @returns {{ localDate: string, tzOffset: number }}
 */
export function getClientLocalDayParams() {
  const now = new Date();
  const localDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    localDate,
    tzOffset: now.getTimezoneOffset(),
  };
}

/**
 * @param {import('@/types/interfaces').Task} task
 * @param {string} dateKey
 * @param {number} tzOffsetMinutes
 * @returns {boolean}
 */
export function isTaskCompletedOnLocalDay(task, dateKey, tzOffsetMinutes) {
  if (task.status !== "Completed" || !task.completedAt) return false;

  const completedAt = new Date(task.completedAt);
  if (Number.isNaN(completedAt.getTime())) return false;

  const { start, end } = localDayBounds(dateKey, tzOffsetMinutes);
  return completedAt >= start && completedAt <= end;
}
