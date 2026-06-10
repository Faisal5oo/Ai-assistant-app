import { format } from "date-fns";
import UserDashboard from "@/models/UserDashboard";

/**
 * @returns {string}
 */
export function serverTodayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * @param {string} userId
 * @returns {Promise<import('mongoose').Document>}
 */
export async function getOrCreateDashboard(userId) {
  const today = serverTodayKey();
  let dashboard = await UserDashboard.findOne({ userId });

  if (!dashboard) {
    dashboard = await UserDashboard.create({
      userId,
      dailyLogs: [],
      pomodoroDaily: { date: today, completed: 0, goal: 4 },
    });
    return dashboard;
  }

  if (dashboard.pomodoroDaily?.date !== today) {
    dashboard.pomodoroDaily = {
      date: today,
      completed: 0,
      goal: dashboard.pomodoroDaily?.goal ?? 4,
    };
    await dashboard.save();
  }

  return dashboard;
}

/**
 * @param {import('mongoose').Document} dashboard
 * @param {string} date
 * @param {number} ms
 */
export function addDailyMsToDashboard(dashboard, date, ms) {
  const logs = dashboard.dailyLogs ?? [];
  const existing = logs.find((l) => l.date === date);

  if (existing) {
    existing.totalMs += ms;
  } else {
    logs.push({ date, totalMs: ms });
  }

  dashboard.dailyLogs = logs;
}
