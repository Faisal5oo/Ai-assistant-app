import { addDays, setHours, setMinutes, subDays, format } from "date-fns";

/**
 * @returns {import('@/types/interfaces').Task[]}
 */
export function createSeedTasks() {
  const now = new Date();
  const at = (dayOffset, hour, minute) =>
    setMinutes(setHours(addDays(now, dayOffset), hour), minute).toISOString();

  return [
    {
      id: "1",
      title: "Review sprint backlog",
      category: "Work",
      priority: "High",
      status: "Completed",
      estimatedTime: 45,
      actualTimeSpent: 42 * 60 * 1000,
      tags: ["planning"],
      scheduledAt: at(0, 9, 0),
      createdAt: at(-2, 10, 0),
    },
    {
      id: "2",
      title: "Design system audit",
      category: "Work",
      priority: "Medium",
      status: "In-Progress",
      estimatedTime: 90,
      actualTimeSpent: 35 * 60 * 1000,
      tags: ["design"],
      scheduledAt: at(0, 10, 30),
      createdAt: at(-1, 14, 0),
    },
    {
      id: "3",
      title: "Read TypeScript patterns chapter",
      category: "Learning",
      priority: "Low",
      status: "Todo",
      estimatedTime: 60,
      actualTimeSpent: 0,
      tags: ["reading"],
      scheduledAt: at(0, 14, 0),
      createdAt: at(0, 8, 0),
    },
    {
      id: "4",
      title: "Morning workout",
      category: "Health",
      priority: "Medium",
      status: "Completed",
      estimatedTime: 30,
      actualTimeSpent: 28 * 60 * 1000,
      tags: ["fitness"],
      scheduledAt: at(0, 7, 0),
      createdAt: at(-3, 7, 0),
    },
    {
      id: "5",
      title: "Grocery planning",
      category: "Personal",
      priority: "Low",
      status: "Todo",
      estimatedTime: 20,
      actualTimeSpent: 0,
      tags: ["errands"],
      scheduledAt: at(0, 18, 0),
      createdAt: at(0, 9, 30),
    },
    {
      id: "6",
      title: "Client presentation prep",
      category: "Work",
      priority: "High",
      status: "Todo",
      estimatedTime: 120,
      actualTimeSpent: 0,
      tags: ["client"],
      scheduledAt: at(0, 11, 0),
      createdAt: at(-1, 16, 0),
    },
    {
      id: "7",
      title: "Team sync notes",
      category: "Work",
      priority: "Medium",
      status: "Completed",
      estimatedTime: 25,
      actualTimeSpent: 22 * 60 * 1000,
      tags: ["meeting"],
      scheduledAt: at(0, 8, 30),
      createdAt: at(-2, 8, 0),
    },
    {
      id: "8",
      title: "Meditation session",
      category: "Health",
      priority: "Low",
      status: "Todo",
      estimatedTime: 15,
      actualTimeSpent: 0,
      tags: ["mindfulness"],
      scheduledAt: at(0, 16, 0),
      createdAt: at(0, 10, 0),
    },
  ];
}

/**
 * @returns {import('@/types/interfaces').DailyTimeLog[]}
 */
export function createSeedDailyLogs() {
  const logs = [];
  for (let i = 6; i >= 0; i--) {
    const d = subDays(new Date(), i);
    const key = format(d, "yyyy-MM-dd");
    const base = [2.1, 3.5, 4.2, 5.8, 5.4, 6.1, 1.2][6 - i];
    logs.push({ date: key, totalMs: base * 60 * 60 * 1000 });
  }
  return logs;
}
