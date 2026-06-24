/**
 * SERVER-ONLY — imports Mongoose models via dashboard-utils.
 * Never import this file from any client component or client-side hook.
 */
import {
  getOrCreateDashboard,
  addDailyMsToDashboard,
  serverTodayKey,
} from "@/lib/dashboard-utils";

/**
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {number} ms
 * @param {string} [date]
 * @returns {Promise<import('@/types/interfaces').DailyTimeLog[] | null>}
 */
export async function creditDashboardCompletionTime(userId, ms, date = serverTodayKey()) {
  if (ms <= 0) return null;

  const dashboard = await getOrCreateDashboard(userId);
  addDailyMsToDashboard(dashboard, date, ms);
  await dashboard.save();

  return dashboard.dailyLogs.map((log) => ({
    date: log.date,
    totalMs: log.totalMs,
  }));
}
