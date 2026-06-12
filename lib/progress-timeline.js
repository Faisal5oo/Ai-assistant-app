import { format, subDays } from "date-fns";

/**
 * @param {import('@/types/interfaces').DailyTimeLog[]} dailyLogs
 * @returns {Record<string, number>}
 */
function dailyLogMap(dailyLogs) {
  return Object.fromEntries((dailyLogs ?? []).map((l) => [l.date, l.totalMs]));
}

/**
 * Builds a 7-day bar chart timeline from dashboard dailyLogs (local calendar days).
 * Matches the dashboard WeeklyProgressChart data source exactly.
 *
 * @param {import('@/types/interfaces').DailyTimeLog[]} dailyLogs
 * @param {number} [weekOffset=0] - 0 = current 7 days ending today, -1 = previous week, etc.
 */
export function buildWeeklyProgressTimeline(dailyLogs, weekOffset = 0) {
  const logMap = dailyLogMap(dailyLogs);
  const todayKey = format(new Date(), "yyyy-MM-dd");
  const weeksBack = Math.max(0, -weekOffset);

  const timeline = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i + weeksBack * 7);
    const date = format(d, "yyyy-MM-dd");
    const totalMs = logMap[date] ?? 0;
    return {
      date,
      totalMs,
      totalHours: Math.round((totalMs / 3_600_000) * 100) / 100,
      isToday: date === todayKey && weekOffset === 0,
    };
  });

  const totalMs = timeline.reduce((sum, day) => sum + day.totalMs, 0);

  return {
    timeline,
    totalMs,
    totalHours: Math.round((totalMs / 3_600_000) * 100) / 100,
    weekStart: timeline[0].date,
    weekEnd: timeline[timeline.length - 1].date,
  };
}

/**
 * Builds a 30-day timeline from dashboard dailyLogs (local calendar days).
 * @param {import('@/types/interfaces').DailyTimeLog[]} dailyLogs
 */
export function buildMonthlyProgressTimeline(dailyLogs) {
  const logMap = dailyLogMap(dailyLogs);
  const todayKey = format(new Date(), "yyyy-MM-dd");

  const timeline = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(new Date(), 29 - i);
    const date = format(d, "yyyy-MM-dd");
    const totalMs = logMap[date] ?? 0;
    return {
      date,
      totalMs,
      totalHours: Math.round((totalMs / 3_600_000) * 100) / 100,
      isToday: date === todayKey,
    };
  });

  const totalMs = timeline.reduce((sum, day) => sum + day.totalMs, 0);

  return {
    timeline,
    totalMs,
    totalHours: Math.round((totalMs / 3_600_000) * 100) / 100,
  };
}

/**
 * @param {string} startKey yyyy-MM-dd
 * @param {string} endKey yyyy-MM-dd
 */
export function formatWeekRangeLabel(startKey, endKey) {
  const start = parseLocalDateKey(startKey);
  const end = parseLocalDateKey(endKey);
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${format(start, "MMM d")} – ${format(end, "d")}`;
  }
  return `${format(start, "MMM d")} – ${format(end, "MMM d")}`;
}

/**
 * @param {string} dateStr
 */
function parseLocalDateKey(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
