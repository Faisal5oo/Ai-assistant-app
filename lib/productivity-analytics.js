import mongoose from "mongoose";
import { format, subDays } from "date-fns";
import PomodoroSessionLog from "@/models/PomodoroSessionLog";
import DeepWorkSessionLog from "@/models/DeepWorkSessionLog";
import Task from "@/models/Task";
import { serverTodayKey } from "@/lib/dashboard-utils";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;

/**
 * @param {number} numerator
 * @param {number} denominator
 */
function safeRatio(numerator, denominator) {
  if (!denominator || !isFinite(denominator)) return 0;
  const result = numerator / denominator;
  return isFinite(result) ? result : 0;
}

/**
 * Builds the productivity summary payload for dashboard and analytics cards.
 * @param {string} userId
 */
export async function buildProductivitySummary(userId) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const todayKey = serverTodayKey();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [sessionAgg, deepWorkAgg, frictionAgg, estimationAgg] = await Promise.all([
    PomodoroSessionLog.aggregate([
      {
        $match: {
          userId: userOid,
          type: "focus",
          createdAt: { $gte: sevenDaysAgo, $lte: now },
        },
      },
      {
        $facet: {
          todayFocus: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(`${todayKey}T00:00:00.000Z`),
                  $lte: now,
                },
              },
            },
            {
              $group: {
                _id: null,
                totalMinutes: { $sum: "$duration" },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                abandoned: {
                  $sum: { $cond: [{ $eq: ["$status", "abandoned"] }, 1, 0] },
                },
              },
            },
          ],
          rollingSevenDay: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                totalMinutes: { $sum: "$duration" },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                abandoned: {
                  $sum: { $cond: [{ $eq: ["$status", "abandoned"] }, 1, 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          completionRatio: [
            {
              $group: {
                _id: null,
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
                },
                abandoned: {
                  $sum: { $cond: [{ $eq: ["$status", "abandoned"] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]),
    DeepWorkSessionLog.aggregate([
      {
        $match: {
          userId: userOid,
          status: "completed",
          createdAt: { $gte: sevenDaysAgo, $lte: now },
        },
      },
      {
        $facet: {
          todayDeepWork: [
            {
              $match: {
                createdAt: {
                  $gte: new Date(`${todayKey}T00:00:00.000Z`),
                  $lte: now,
                },
              },
            },
            {
              $group: {
                _id: null,
                totalMinutes: { $sum: "$actualDurationMinutes" },
                sessions: { $sum: 1 },
                breakthroughs: {
                  $sum: { $cond: ["$objectiveAchieved", 1, 0] },
                },
              },
            },
          ],
          rollingSevenDay: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                totalMinutes: { $sum: "$actualDurationMinutes" },
                sessions: { $sum: 1 },
                breakthroughs: {
                  $sum: { $cond: ["$objectiveAchieved", 1, 0] },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          breakthroughAccuracy: [
            {
              $group: {
                _id: null,
                sessions: { $sum: 1 },
                breakthroughs: {
                  $sum: { $cond: ["$objectiveAchieved", 1, 0] },
                },
              },
            },
          ],
          streakDays: [
            {
              $group: {
                _id: {
                  $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
              },
            },
            { $sort: { _id: -1 } },
          ],
          earlyCompletions: [
            {
              $group: {
                _id: null,
                count: { $sum: { $cond: ["$completedEarly", 1, 0] } },
                minutesSaved: { $sum: "$minutesSaved" },
              },
            },
          ],
        },
      },
    ]),
    DeepWorkSessionLog.aggregate([
      {
        $match: {
          userId: userOid,
          status: "abandoned",
          abandonReason: { $ne: null },
          createdAt: { $gte: sevenDaysAgo, $lte: now },
        },
      },
      {
        $group: {
          _id: "$abandonReason",
          count: { $sum: 1 },
        },
      },
    ]),
    Task.aggregate([
      {
        $match: {
          userId: userOid,
          status: "Completed",
        },
      },
      {
        $group: {
          _id: null,
          totalEstimatedMinutes: { $sum: "$estimatedTime" },
          totalActualMs: { $sum: "$actualTimeSpent" },
          taskCount: { $sum: 1 },
        },
      },
    ]),
  ]);

  const sessionData = sessionAgg[0] ?? {};
  const todayRow = sessionData.todayFocus?.[0] ?? {
    totalMinutes: 0,
    completed: 0,
    abandoned: 0,
  };
  const ratioRow = sessionData.completionRatio?.[0] ?? {
    completed: 0,
    abandoned: 0,
  };
  const estimationRow = estimationAgg[0] ?? {
    totalEstimatedMinutes: 0,
    totalActualMs: 0,
    taskCount: 0,
  };

  const deepWorkData = deepWorkAgg[0] ?? {};
  const deepWorkToday = deepWorkData.todayDeepWork?.[0] ?? {
    totalMinutes: 0,
    sessions: 0,
    breakthroughs: 0,
  };
  const deepWorkAccuracyRow = deepWorkData.breakthroughAccuracy?.[0] ?? {
    sessions: 0,
    breakthroughs: 0,
  };
  const earlyRow = deepWorkData.earlyCompletions?.[0] ?? {
    count: 0,
    minutesSaved: 0,
  };
  const frictionRows = frictionAgg ?? [];
  const frictionMap = Object.fromEntries(
    frictionRows.map((row) => [row._id, row.count])
  );
  const totalFriction =
    (frictionMap.cognitive_depletion ?? 0) +
    (frictionMap.external_friction ?? 0) +
    (frictionMap.dopamine_pull ?? 0);
  const deepWorkByDate = Object.fromEntries(
    (deepWorkData.rollingSevenDay ?? []).map((row) => [row._id, row])
  );

  const deepWorkRolling = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const row = deepWorkByDate[key];
    return {
      date: key,
      focusMinutes: row?.totalMinutes ?? 0,
      sessions: row?.sessions ?? 0,
      breakthroughs: row?.breakthroughs ?? 0,
    };
  });

  const streakDates = (deepWorkData.streakDays ?? []).map((row) => row._id);
  let currentStreak = 0;
  for (let i = 0; i < streakDates.length; i++) {
    const expected = format(subDays(new Date(), i), "yyyy-MM-dd");
    if (streakDates[i] === expected) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const totalEstimatedMs = estimationRow.totalEstimatedMinutes * MS_PER_MINUTE;
  const totalActualMs = estimationRow.totalActualMs;
  const deltaMs = totalActualMs - totalEstimatedMs;
  const deltaPct =
    totalEstimatedMs > 0
      ? Math.round(safeRatio(deltaMs, totalEstimatedMs) * 1000) / 10
      : null;

  const completedSessions = ratioRow.completed ?? 0;
  const abandonedSessions = ratioRow.abandoned ?? 0;
  const totalSessions = completedSessions + abandonedSessions;

  const sessionByDate = Object.fromEntries(
    (sessionData.rollingSevenDay ?? []).map((row) => [row._id, row])
  );

  const rollingTimeline = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const row = sessionByDate[key];
    const deepRow = deepWorkByDate[key];
    const totalMinutes = (row?.totalMinutes ?? 0) + (deepRow?.totalMinutes ?? 0);
    return {
      date: key,
      focusMinutes: totalMinutes,
      focusHours: Math.round((totalMinutes / 60) * 100) / 100,
      completed: (row?.completed ?? 0) + (deepRow?.sessions ?? 0),
      abandoned: row?.abandoned ?? 0,
    };
  });

  const todayFocusMinutes =
    todayRow.totalMinutes + (deepWorkToday.totalMinutes ?? 0);

  return {
    focusHours: {
      today: Math.round((todayFocusMinutes / 60) * 100) / 100,
      todayMinutes: todayFocusMinutes,
      rollingSevenDay: rollingTimeline,
    },
    sessionCompletion: {
      completed: completedSessions + (deepWorkToday.sessions ?? 0),
      abandoned: abandonedSessions + totalFriction,
      completionRatio:
        totalSessions > 0
          ? Math.round(safeRatio(completedSessions, totalSessions) * 1000) / 1000
          : null,
    },
    deepWork: {
      todaySessions: deepWorkToday.sessions ?? 0,
      todayBreakthroughs: deepWorkToday.breakthroughs ?? 0,
      breakthroughAccuracy:
        deepWorkAccuracyRow.sessions > 0
          ? Math.round(
              safeRatio(
                deepWorkAccuracyRow.breakthroughs,
                deepWorkAccuracyRow.sessions
              ) * 1000
            ) / 10
          : null,
      currentStreak,
      earlyCompletions: earlyRow.count ?? 0,
      totalMinutesSaved: earlyRow.minutesSaved ?? 0,
      energyCycles: {
        cognitiveDepletion: frictionMap.cognitive_depletion ?? 0,
        externalFriction: frictionMap.external_friction ?? 0,
        dopaminePull: frictionMap.dopamine_pull ?? 0,
        total: totalFriction,
      },
      rollingSevenDay: deepWorkRolling,
    },
    estimationBias: {
      completedTaskCount: estimationRow.taskCount,
      totalEstimatedMinutes: estimationRow.totalEstimatedMinutes,
      totalEstimatedHours:
        Math.round((estimationRow.totalEstimatedMinutes / 60) * 100) / 100,
      totalActualMs,
      totalActualHours: Math.round((totalActualMs / MS_PER_HOUR) * 100) / 100,
      deltaMs,
      deltaPct,
      accuracyScore:
        totalEstimatedMs > 0
          ? Math.round(
              Math.max(
                0,
                100 - Math.abs(safeRatio(deltaMs, totalEstimatedMs) * 100)
              )
            )
          : null,
    },
    generatedAt: now.toISOString(),
  };
}
