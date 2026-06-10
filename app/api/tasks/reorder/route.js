import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { reorderTasksSchema } from "@/lib/validations/task";

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

    /** @type {import('mongoose').AnyBulkWriteOperation[]} */
    const operations = taskIds.map((taskId, index) => ({
      updateOne: {
        filter: { _id: taskId, userId: auth.id },
        update: { $set: { status: columnId, sortOrder: index } },
      },
    }));

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tasks reorder PUT]", error);
    return NextResponse.json(
      { success: false, error: "Could not reorder tasks." },
      { status: 500 }
    );
  }
}
