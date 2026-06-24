import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { reorderTasksSchema } from "@/lib/validations/task";
import { resolveCompletionFallbackMs } from "@/lib/task-completion-time";
import { creditDashboardCompletionTime } from "@/lib/task-completion-time.server";

export const dynamic = "force-dynamic";

/**
 * @param {string} userId
 * @param {string[]} taskIds
 */
async function assertOwnedTasks(userId, taskIds) {
  if (taskIds.length === 0) return true;

  const count = await Task.countDocuments({
    userId,
    _id: { $in: taskIds },
  });

  return count === taskIds.length;
}

export async function PUT(request) {
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

    const parsed = reorderTasksSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { columnId, taskIds, sourceColumnId, sourceTaskIds } = parsed.data;

    await connectDB();

    const allTaskIds = [
      ...taskIds,
      ...(sourceTaskIds ?? []),
    ];

    if (!(await assertOwnedTasks(auth.id, allTaskIds))) {
      return NextResponse.json(
        { success: false, error: "One or more tasks were not found." },
        { status: 404 }
      );
    }

    /** @type {Map<string, number>} */
    const completionFallbackById = new Map();

    if (columnId === "Completed") {
      const completingTasks = await Task.find(
        {
          _id: { $in: taskIds },
          userId: auth.id,
          status: { $ne: "Completed" },
        },
        { actualTimeSpent: 1, estimatedTime: 1 }
      ).lean();

      for (const task of completingTasks) {
        const fallbackMs = resolveCompletionFallbackMs(task);
        if (fallbackMs != null) {
          completionFallbackById.set(String(task._id), fallbackMs);
        }
      }
    }

    /** @type {import('mongoose').AnyBulkWriteOperation[]} */
    const operations = taskIds.map((taskId, index) => {
      const fallbackMs = completionFallbackById.get(taskId);
      const $set = {
        status: columnId,
        sortOrder: index,
        ...(columnId === "Completed" ? { completedAt: new Date() } : {}),
        ...(fallbackMs != null ? { actualTimeSpent: fallbackMs } : {}),
      };

      return {
        updateOne: {
          filter: { _id: taskId, userId: auth.id },
          update: { $set },
        },
      };
    });

    if (sourceColumnId && sourceTaskIds?.length) {
      sourceTaskIds.forEach((taskId, index) => {
        operations.push({
          updateOne: {
            filter: { _id: taskId, userId: auth.id },
            update: { $set: { sortOrder: index } },
          },
        });
      });
    }

    await Task.bulkWrite(operations, { ordered: false });

    const totalFallbackMs = [...completionFallbackById.values()].reduce(
      (sum, ms) => sum + ms,
      0
    );
    const dailyLogs =
      totalFallbackMs > 0
        ? await creditDashboardCompletionTime(auth.id, totalFallbackMs)
        : null;

    return NextResponse.json({
      success: true,
      ...(dailyLogs ? { dailyLogs } : {}),
    });
  } catch (error) {
    console.error("[tasks reorder PUT]", error);
    return NextResponse.json(
      { success: false, error: "Could not reorder tasks." },
      { status: 500 }
    );
  }
}
