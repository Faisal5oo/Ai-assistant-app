import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import PomodoroSessionLog from "@/models/PomodoroSessionLog";
import DeepWorkSessionLog from "@/models/DeepWorkSessionLog";
import BatchSprintLog from "@/models/BatchSprintLog";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { updateDashboardSchema } from "@/lib/validations/dashboard";
import { toClientDashboard, toClientTask } from "@/lib/task-serializers";
import {
  getOrCreateDashboard,
  addDailyMsToDashboard,
  serverTodayKey,
} from "@/lib/dashboard-utils";
import { getSlotAllocations } from "@/lib/time-block-allocations";
import { formatHourRangeLabel } from "@/lib/timeBlocking";
import { format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

/**
 * Computes a session-based focus score (0–100) from Pomodoro and DeepWork logs.
 * Ratio of completed sessions vs. total sessions logged.
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function computeSessionFocusScore(userId) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const since = subDays(new Date(), 7);

  const [pomodoroStats, deepWorkStats] = await Promise.all([
    PomodoroSessionLog.aggregate([
      { $match: { userId: userOid, type: "focus", createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]),
    DeepWorkSessionLog.aggregate([
      { $match: { userId: userOid, createdAt: { $gte: since } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const pTotal = pomodoroStats[0]?.total ?? 0;
  const pCompleted = pomodoroStats[0]?.completed ?? 0;
  const dwTotal = deepWorkStats[0]?.total ?? 0;
  const dwCompleted = deepWorkStats[0]?.completed ?? 0;

  const grandTotal = pTotal + dwTotal;
  if (grandTotal === 0) return null;

  return Math.round(((pCompleted + dwCompleted) / grandTotal) * 100);
}

/**
 * Aggregates daily focus duration (ms) for the past 7 days from all session log sources.
 * Merges Pomodoro completed focus sessions, DeepWork sessions, and Batch Sprint sessions.
 * Returns a map of dateKey (yyyy-MM-dd) -> totalMs.
 * @param {string} userId
 * @returns {Promise<Record<string, number>>}
 */
async function computeWeeklySessionMs(userId) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const since = subDays(new Date(), 6);
  since.setHours(0, 0, 0, 0);

  const dateField = { format: "%Y-%m-%d", timezone: "UTC" };

  const [pomodoroRows, deepWorkRows, batchRows] = await Promise.all([
    PomodoroSessionLog.aggregate([
      {
        $match: {
          userId: userOid,
          type: "focus",
          status: "completed",
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { ...dateField, date: "$createdAt" } },
          totalMs: { $sum: { $multiply: ["$duration", 60000] } },
        },
      },
    ]),
    DeepWorkSessionLog.aggregate([
      {
        $match: {
          userId: userOid,
          status: "completed",
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { ...dateField, date: "$createdAt" } },
          totalMs: { $sum: { $multiply: ["$actualDurationMinutes", 60000] } },
        },
      },
    ]),
    BatchSprintLog.aggregate([
      {
        $match: {
          userId: userOid,
          status: "completed",
          createdAt: { $gte: since },
        },
      },
      {
        $group: {
          _id: { $dateToString: { ...dateField, date: "$createdAt" } },
          totalMs: { $sum: "$durationMs" },
        },
      },
    ]),
  ]);

  /** @type {Record<string, number>} */
  const map = {};
  for (const row of [...pomodoroRows, ...deepWorkRows, ...batchRows]) {
    map[row._id] = (map[row._id] ?? 0) + (row.totalMs ?? 0);
  }
  return map;
}

/**
 * Merges session-log weekly ms into the dashboard dailyLogs array.
 * Session-log ms is additive to task time spent already in dailyLogs.
 * Returns an enriched dailyLogs array covering the past 7 days.
 * @param {Array<{date: string, totalMs: number}>} dailyLogs
 * @param {Record<string, number>} sessionMs
 * @returns {Array<{date: string, totalMs: number}>}
 */
function mergeWeeklyLogs(dailyLogs, sessionMs) {
  const logMap = Object.fromEntries(dailyLogs.map((l) => [l.date, l.totalMs]));

  for (const [date, ms] of Object.entries(sessionMs)) {
    logMap[date] = (logMap[date] ?? 0) + ms;
  }

  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const date = format(d, "yyyy-MM-dd");
    return { date, totalMs: logMap[date] ?? 0 };
  });
}

/**
 * Aggregates wellness micro-habit adherence from the last 7 days of completed
 * focus sessions across both PomodoroSessionLog and DeepWorkSessionLog.
 *
 * Returns per-habit counts: { matched: number, total: number } for three habits.
 * Sessions that did not submit a wellness field are counted in `total` but not
 * in `matched`, giving an honest rate even for sessions before the field existed.
 *
 * @param {string} userId
 * @returns {Promise<{
 *   hydration: { matched: number, total: number },
 *   stretching: { matched: number, total: number },
 *   phoneAvoidance: { matched: number, total: number },
 * }>}
 */
async function computeWellnessStats(userId) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const since = subDays(new Date(), 7);

  const wellnessPipeline = [
    {
      $match: {
        userId: userOid,
        status: "completed",
        type: { $in: ["focus"] },
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        hydration: {
          $sum: { $cond: [{ $eq: ["$wellness.tookHydrationBreak", true] }, 1, 0] },
        },
        stretching: {
          $sum: {
            $cond: [{ $eq: ["$wellness.stretchedDuringInterval", true] }, 1, 0],
          },
        },
        phoneAvoidance: {
          $sum: {
            $cond: [
              { $eq: ["$wellness.avoidedPhoneDistraction", true] },
              1,
              0,
            ],
          },
        },
      },
    },
  ];

  const deepWorkPipeline = [
    {
      $match: {
        userId: userOid,
        status: "completed",
        createdAt: { $gte: since },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        hydration: {
          $sum: { $cond: [{ $eq: ["$wellness.tookHydrationBreak", true] }, 1, 0] },
        },
        stretching: {
          $sum: {
            $cond: [{ $eq: ["$wellness.stretchedDuringInterval", true] }, 1, 0],
          },
        },
        phoneAvoidance: {
          $sum: {
            $cond: [
              { $eq: ["$wellness.avoidedPhoneDistraction", true] },
              1,
              0,
            ],
          },
        },
      },
    },
  ];

  const [pomRows, dwRows] = await Promise.all([
    PomodoroSessionLog.aggregate(wellnessPipeline),
    DeepWorkSessionLog.aggregate(deepWorkPipeline),
  ]);

  const p = pomRows[0] ?? { total: 0, hydration: 0, stretching: 0, phoneAvoidance: 0 };
  const d = dwRows[0] ?? { total: 0, hydration: 0, stretching: 0, phoneAvoidance: 0 };

  const total = p.total + d.total;

  return {
    hydration: { matched: p.hydration + d.hydration, total },
    stretching: { matched: p.stretching + d.stretching, total },
    phoneAvoidance: { matched: p.phoneAvoidance + d.phoneAvoidance, total },
  };
}

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    await connectDB();

    const [dashboard, sessionFocusScore, sessionMs, wellnessStats] =
      await Promise.all([
        getOrCreateDashboard(auth.id),
        computeSessionFocusScore(auth.id),
        computeWeeklySessionMs(auth.id),
        computeWellnessStats(auth.id),
      ]);

    const dateKey = serverTodayKey();
    const currentHour = new Date().getHours();

    const openTasks = await Task.find({
      userId: auth.id,
      status: { $ne: "Completed" },
    }).lean();

    const clientTasks = openTasks.map(toClientTask);
    const allocations = getSlotAllocations(clientTasks, currentHour, dateKey);

    const activeTimeBlock =
      allocations.length > 0
        ? {
            date: dateKey,
            hour: currentHour,
            rangeLabel: formatHourRangeLabel(currentHour),
            tasks: allocations.map(({ task, durationMinutes }) => ({
              taskId: task.id,
              title: task.title,
              category: task.category,
              priority: task.priority,
              durationMinutes,
            })),
          }
        : null;

    const clientDashboard = toClientDashboard(dashboard);
    const enrichedDailyLogs = mergeWeeklyLogs(
      clientDashboard.dailyLogs,
      sessionMs
    );

    return NextResponse.json({
      success: true,
      dashboard: {
        ...clientDashboard,
        dailyLogs: enrichedDailyLogs,
        sessionFocusScore,
        wellnessStats,
      },
      activeTimeBlock,
    });
  } catch (error) {
    console.error("[dashboard GET]", error);
    return NextResponse.json(
      { success: false, error: "Could not load dashboard." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = updateDashboardSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const dashboard = await getOrCreateDashboard(auth.id);
    const { addDailyMs, pomodoroDaily, pomodoroIncrement, activeFocusSession, activeDeepWorkSession, activeBatchSprint, activePomodoroTimer, activeTimeBlockRunway, activeFlowSession, deepWorkDaily } =
      parsed.data;

    if (addDailyMs) {
      addDailyMsToDashboard(dashboard, addDailyMs.date, addDailyMs.ms);
    }

    if (pomodoroDaily) {
      dashboard.pomodoroDaily = pomodoroDaily;
    }

    if (activeFocusSession === null) {
      dashboard.set("activeFocusSession", undefined);
    } else if (activeFocusSession) {
      dashboard.activeFocusSession = {
        ...activeFocusSession,
        updatedAt: new Date(),
      };
    }

    if (activeDeepWorkSession === null) {
      dashboard.set("activeDeepWorkSession", undefined);
    } else if (activeDeepWorkSession) {
      dashboard.activeDeepWorkSession = {
        ...activeDeepWorkSession,
        updatedAt: new Date(),
      };
    }

    if (activeBatchSprint === null) {
      dashboard.set("activeBatchSprint", undefined);
    } else if (activeBatchSprint) {
      dashboard.activeBatchSprint = {
        ...activeBatchSprint,
        updatedAt: new Date(),
      };
    }

    if (activePomodoroTimer === null) {
      dashboard.set("activePomodoroTimer", undefined);
    } else if (activePomodoroTimer) {
      dashboard.activePomodoroTimer = {
        ...activePomodoroTimer,
        updatedAt: new Date(),
      };
    }

    if (activeTimeBlockRunway === null) {
      dashboard.set("activeTimeBlockRunway", undefined);
    } else if (activeTimeBlockRunway) {
      dashboard.activeTimeBlockRunway = {
        ...activeTimeBlockRunway,
        updatedAt: new Date(),
      };
    }

    if (activeFlowSession === null) {
      dashboard.set("activeFlowSession", undefined);
    } else if (activeFlowSession) {
      dashboard.activeFlowSession = {
        ...activeFlowSession,
        updatedAt: new Date(),
      };
    }

    if (deepWorkDaily) {
      dashboard.deepWorkDaily = deepWorkDaily;
    }

    if (pomodoroIncrement) {
      const today = pomodoroIncrement.date;
      const current = dashboard.pomodoroDaily ?? {
        date: today,
        completed: 0,
        goal: pomodoroIncrement.goal ?? 4,
      };

      if (current.date !== today) {
        dashboard.pomodoroDaily = {
          date: today,
          completed: 1,
          goal: pomodoroIncrement.goal ?? current.goal ?? 4,
        };
      } else {
        dashboard.pomodoroDaily = {
          date: today,
          completed: current.completed + 1,
          goal: pomodoroIncrement.goal ?? current.goal ?? 4,
        };
      }
    }

    await dashboard.save();

    return NextResponse.json({
      success: true,
      dashboard: toClientDashboard(dashboard),
    });
  } catch (error) {
    console.error("[dashboard PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Could not update dashboard." },
      { status: 500 }
    );
  }
}
