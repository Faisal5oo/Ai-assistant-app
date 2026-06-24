import { localDayBounds } from "@/lib/local-day-bounds";

/**
 * Active tasks plus completions stamped within the user's local calendar day.
 *
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {string} localDate - yyyy-MM-dd
 * @param {number} tzOffsetMinutes
 */
export function buildTodayScopeTaskFilter(userId, localDate, tzOffsetMinutes) {
  const { start, end } = localDayBounds(localDate, tzOffsetMinutes);

  return {
    userId,
    $or: [
      { status: { $ne: "Completed" } },
      {
        status: "Completed",
        completedAt: { $gte: start, $lte: end },
      },
    ],
  };
}

/**
 * Completed tasks from before the user's local calendar day (historical archive).
 *
 * @param {import('mongoose').Types.ObjectId | string} userId
 * @param {string} localDate - yyyy-MM-dd
 * @param {number} tzOffsetMinutes
 */
export function buildArchivedCompletedFilter(userId, localDate, tzOffsetMinutes) {
  const { start } = localDayBounds(localDate, tzOffsetMinutes);

  return {
    userId,
    status: "Completed",
    $or: [
      { completedAt: { $lt: start } },
      { completedAt: { $exists: false } },
      { completedAt: null },
    ],
  };
}
