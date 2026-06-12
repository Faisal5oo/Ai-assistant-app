import mongoose from "mongoose";
import Task from "@/models/Task";

const CATEGORIES = ["Work", "Personal", "Learning", "Health"];
const MS_PER_HOUR = 3_600_000;
const SAFE_ZERO = 0;

/**
 * Returns UTC-midnight Date boundaries for a range window.
 * @param {"week"|"month"} range
 * @param {number} [offset=0] - 0 = current window, -1 = previous window
 * @returns {{ start: Date, end: Date, days: number }}
 */
export function getWindowBounds(range, offset = 0) {
  const now = new Date();
  const days = range === "month" ? 30 : 7;
  const windowMs = days * 24 * 60 * 60 * 1000;

  const end = new Date(now.getTime() + offset * windowMs);
  const start = new Date(end.getTime() - windowMs);

  // Clamp end to now for the current window
  if (offset === 0) {
    return { start, end: now, days };
  }
  return { start, end, days };
}

/**
 * Generates a date-key (yyyy-MM-dd) in UTC for a given Date.
 * @param {Date} d
 */
function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Safe division — returns 0 instead of NaN/Infinity.
 * @param {number} numerator
 * @param {number} denominator
 */
function safeDivide(numerator, denominator) {
  if (!denominator || !isFinite(denominator)) return SAFE_ZERO;
  const result = numerator / denominator;
  return isFinite(result) ? result : SAFE_ZERO;
}

/**
 * Computes the focus score (0-100) from component ratios.
 * Formula mirrors the client-side calculateFocusScore but runs server-side.
 * @param {number} completionRate   0-1
 * @param {number} accuracyRate     0-1
 * @param {number} highPriorityRate 0-1
 */
function computeFocusScore(completionRate, accuracyRate, highPriorityRate) {
  const raw = completionRate * 0.45 + accuracyRate * 0.35 + highPriorityRate * 0.2;
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

/**
 * Calculates percentage delta between current and previous, returning null when
 * previous is zero (no meaningful baseline exists).
 * @param {number} current
 * @param {number} previous
 * @returns {number|null}
 */
function pctDelta(current, previous) {
  if (previous === 0) return null;
  return Math.round(safeDivide(current - previous, previous) * 1000) / 10;
}

/**
 * Derive estimation bias label from aggregate delta.
 * @param {number} totalEstimatedMs
 * @param {number} totalActualMs
 * @returns {string}
 */
function estimationBiasLabel(totalEstimatedMs, totalActualMs) {
  if (totalEstimatedMs === 0 || totalActualMs === 0) return "insufficient_data";
  const ratio = safeDivide(totalActualMs, totalEstimatedMs);
  const pct = Math.abs(Math.round((ratio - 1) * 100));
  if (ratio > 1.05) return `underestimated_by_${pct}_percent`;
  if (ratio < 0.95) return `overestimated_by_${pct}_percent`;
  return "on_target";
}

/**
 * Runs the full analytics aggregation for a single time window.
 *
 * Returns explicit zero/empty safe defaults when no tasks exist in the window.
 *
 * @param {string} userId
 * @param {{ start: Date, end: Date, days: number }} window
 * @returns {Promise<WindowMetrics>}
 */
export async function computeWindowMetrics(userId, window) {
  const userOid = new mongoose.Types.ObjectId(userId);
  const { start, end, days } = window;

  // ─── Primary aggregation ────────────────────────────────────────────────────
  // We query ALL user tasks created within the window (or completed within it).
  // A single $facet splits the work into parallel pipelines in one round-trip.
  const [result] = await Task.aggregate([
    {
      $match: {
        userId: userOid,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        // ── Focus score components ──
        focusComponents: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: {
                $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
              },
              withEstimateAndActual: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ["$estimatedTime", 0] },
                        { $gt: ["$actualTimeSpent", 0] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              // Count tasks completed within estimate (actual <= estimated)
              withinEstimate: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$status", "Completed"] },
                        { $gt: ["$estimatedTime", 0] },
                        {
                          // actualTimeSpent (ms) <= estimatedTime (min) * 60 * 1000
                          $lte: [
                            "$actualTimeSpent",
                            { $multiply: ["$estimatedTime", 60000] },
                          ],
                        },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              highTotal: {
                $sum: {
                  $cond: [{ $eq: ["$priority", "High"] }, 1, 0],
                },
              },
              highCompleted: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$priority", "High"] },
                        { $eq: ["$status", "Completed"] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
            },
          },
        ],

        // ── Time by category ──
        byCategory: [
          {
            $group: {
              _id: "$category",
              totalMs: { $sum: "$actualTimeSpent" },
            },
          },
        ],

        // ── Estimated vs. actual per-task ──
        estimatedVsActual: [
          {
            $match: {
              $expr: {
                $or: [
                  { $gt: ["$estimatedTime", 0] },
                  { $gt: ["$actualTimeSpent", 0] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              title: 1,
              estimatedMs: { $multiply: ["$estimatedTime", 60000] },
              actualMs: "$actualTimeSpent",
              status: 1,
            },
          },
        ],

        // ── Aggregate estimated/actual totals for bias detection ──
        estimationTotals: [
          {
            $match: { status: "Completed" },
          },
          {
            $group: {
              _id: null,
              totalEstimatedMs: {
                $sum: { $multiply: ["$estimatedTime", 60000] },
              },
              totalActualMs: { $sum: "$actualTimeSpent" },
            },
          },
        ],

        // ── Most productive day of week (most actualTimeSpent on completed tasks) ──
        byDayOfWeek: [
          {
            $match: {
              status: "Completed",
              completedAt: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: { $dayOfWeek: "$completedAt" },
              totalMs: { $sum: "$actualTimeSpent" },
            },
          },
          { $sort: { totalMs: -1 } },
          { $limit: 1 },
        ],
      },
    },
  ]);

  // ─── Time-log based daily distribution (uses timeLogs sub-documents) ────────
  // We unwind timeLogs to compute per-day accumulated hours from actual intervals.
  const timeLogDays = await Task.aggregate([
    {
      $match: {
        userId: userOid,
        "timeLogs.0": { $exists: true },
      },
    },
    { $unwind: "$timeLogs" },
    {
      $match: {
        "timeLogs.startedAt": { $gte: start, $lte: end },
      },
    },
    {
      $addFields: {
        logDurationMs: {
          $subtract: ["$timeLogs.stoppedAt", "$timeLogs.startedAt"],
        },
        dateKey: {
          $dateToString: { format: "%Y-%m-%d", date: "$timeLogs.startedAt" },
        },
      },
    },
    {
      $group: {
        _id: "$dateKey",
        totalMs: { $sum: "$logDurationMs" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // ─── Parse focusComponents ───────────────────────────────────────────────────
  const fc = result?.focusComponents?.[0] ?? {};
  const total = fc.total ?? 0;
  const completed = fc.completed ?? 0;
  const withinEstimate = fc.withinEstimate ?? 0;
  const withEstimateAndActual = fc.withEstimateAndActual ?? 0;
  const highTotal = fc.highTotal ?? 0;
  const highCompleted = fc.highCompleted ?? 0;

  const completionRate = safeDivide(completed, total);
  const accuracyRate = safeDivide(withinEstimate, Math.max(withEstimateAndActual, completed));
  const highPriorityRate = safeDivide(highCompleted, Math.max(highTotal, 1));
  const focusScore = computeFocusScore(completionRate, accuracyRate, highPriorityRate);

  // ─── Parse byCategory ────────────────────────────────────────────────────────
  const categoryMap = Object.fromEntries(
    CATEGORIES.map((c) => [c, 0])
  );
  for (const row of result?.byCategory ?? []) {
    if (categoryMap.hasOwnProperty(row._id)) {
      categoryMap[row._id] = row.totalMs ?? 0;
    }
  }
  const totalTrackedMs = Object.values(categoryMap).reduce((s, v) => s + v, 0);

  // ─── Parse estimatedVsActual ─────────────────────────────────────────────────
  const estimatedVsActual = (result?.estimatedVsActual ?? []).map((t) => ({
    id: t._id.toString(),
    title: t.title,
    estimatedMs: t.estimatedMs ?? 0,
    actualMs: t.actualMs ?? 0,
    status: t.status,
    deltaMs: (t.actualMs ?? 0) - (t.estimatedMs ?? 0),
  }));

  // ─── Parse estimation totals ─────────────────────────────────────────────────
  const et = result?.estimationTotals?.[0] ?? {};
  const totalEstimatedMs = et.totalEstimatedMs ?? 0;
  const totalActualMs = et.totalActualMs ?? 0;

  // ─── Build daily distribution timeline ──────────────────────────────────────
  const timeLogMap = Object.fromEntries(
    timeLogDays.map((d) => [d._id, d.totalMs])
  );

  // Fall back to actualTimeSpent-based distribution from createdAt if no timeLogs
  // exist for the window (legacy tasks with no interval records).
  const legacyDays = await Task.aggregate([
    {
      $match: {
        userId: userOid,
        createdAt: { $gte: start, $lte: end },
        actualTimeSpent: { $gt: 0 },
        "timeLogs.0": { $exists: false },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        totalMs: { $sum: "$actualTimeSpent" },
      },
    },
  ]);
  for (const row of legacyDays) {
    timeLogMap[row._id] = (timeLogMap[row._id] ?? 0) + row.totalMs;
  }

  const timeline = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const key = toDateKey(d);
    timeline.push({
      date: key,
      totalMs: timeLogMap[key] ?? 0,
      totalHours: Math.round(safeDivide(timeLogMap[key] ?? 0, MS_PER_HOUR) * 100) / 100,
    });
  }

  // ─── AI context helpers ───────────────────────────────────────────────────────
  const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const topDowRow = result?.byDayOfWeek?.[0];
  // MongoDB $dayOfWeek: 1=Sunday … 7=Saturday
  const mostProductiveDayOfWeek = topDowRow
    ? DOW_NAMES[(topDowRow._id ?? 1) - 1]
    : null;

  const highestTimeSinkCategory = Object.entries(categoryMap).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] ?? null;

  return {
    focusScore,
    scoreComponents: {
      completionRate: Math.round(completionRate * 1000) / 10,
      accuracyRate: Math.round(accuracyRate * 1000) / 10,
      highPriorityRate: Math.round(highPriorityRate * 1000) / 10,
    },
    taskCounts: {
      total,
      completed,
      withinEstimate,
      highTotal,
      highCompleted,
    },
    timeByCategory: categoryMap,
    totalTrackedMs,
    timeline,
    estimatedVsActual,
    estimationTotals: {
      totalEstimatedMs,
      totalActualMs,
      biasLabel: estimationBiasLabel(totalEstimatedMs, totalActualMs),
    },
    aiContext: {
      mostProductiveDayOfWeek,
      highestTimeSinkCategory,
    },
  };
}

/**
 * Computes full analytics payload including period-over-period deltas.
 *
 * @param {string} userId
 * @param {"week"|"month"} range
 * @returns {Promise<AnalyticsPayload>}
 */
export async function buildAnalyticsPayload(userId, range) {
  const currentWindow = getWindowBounds(range, 0);
  const previousWindow = getWindowBounds(range, -1);

  const [current, previous] = await Promise.all([
    computeWindowMetrics(userId, currentWindow),
    computeWindowMetrics(userId, previousWindow),
  ]);

  const scoreDeltaPct = pctDelta(current.focusScore, previous.focusScore);
  const hoursDeltaPct = pctDelta(
    current.totalTrackedMs,
    previous.totalTrackedMs
  );
  const completionDeltaPct = pctDelta(
    current.taskCounts.completed,
    previous.taskCounts.completed
  );

  const estimationBias = current.estimationTotals.biasLabel;

  return {
    range,
    window: {
      start: currentWindow.start.toISOString(),
      end: currentWindow.end.toISOString(),
      days: currentWindow.days,
    },
    summary: {
      currentFocusScore: current.focusScore,
      previousFocusScore: previous.focusScore,
      scoreDeltaPct,
      currentTotalHours:
        Math.round(safeDivide(current.totalTrackedMs, MS_PER_HOUR) * 100) / 100,
      previousTotalHours:
        Math.round(safeDivide(previous.totalTrackedMs, MS_PER_HOUR) * 100) / 100,
      hoursDeltaPct,
      currentCompletedTasks: current.taskCounts.completed,
      previousCompletedTasks: previous.taskCounts.completed,
      completionDeltaPct,
    },
    scoreComponents: current.scoreComponents,
    taskCounts: current.taskCounts,
    timeByCategory: Object.fromEntries(
      Object.entries(current.timeByCategory).map(([k, v]) => [
        k,
        {
          totalMs: v,
          totalHours: Math.round(safeDivide(v, MS_PER_HOUR) * 100) / 100,
        },
      ])
    ),
    totalTrackedMs: current.totalTrackedMs,
    totalTrackedHours:
      Math.round(safeDivide(current.totalTrackedMs, MS_PER_HOUR) * 100) / 100,
    timeline: current.timeline,
    estimatedVsActual: current.estimatedVsActual,
    estimationTotals: current.estimationTotals,
    aiContext: {
      mostProductiveDayOfWeek: current.aiContext.mostProductiveDayOfWeek,
      highestTimeSinkCategory: current.aiContext.highestTimeSinkCategory,
      estimationBias,
      velocityTrend:
        hoursDeltaPct === null
          ? "no_baseline"
          : hoursDeltaPct > 10
          ? "accelerating"
          : hoursDeltaPct < -10
          ? "decelerating"
          : "steady",
      focusTrend:
        scoreDeltaPct === null
          ? "no_baseline"
          : scoreDeltaPct > 5
          ? "improving"
          : scoreDeltaPct < -5
          ? "declining"
          : "stable",
    },
  };
}
