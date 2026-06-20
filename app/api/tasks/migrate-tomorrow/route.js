import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth } from "@/lib/api-auth";
import { toClientTask } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

/**
 * POST /api/tasks/migrate-tomorrow
 *
 * Batch-shifts all of the authenticated user's Pending / In-Progress tasks
 * that are scheduled for today (or have no scheduledAt but were updated today)
 * onto the next calendar day.
 *
 * Body: { taskIds: string[] }  — explicit list of task IDs to migrate.
 */
export async function POST(request) {
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

    const { taskIds } = body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "taskIds must be a non-empty array." },
        { status: 400 }
      );
    }

    // Validate ownership — only update tasks that belong to this user
    if (taskIds.length > 200) {
      return NextResponse.json(
        { success: false, error: "Cannot migrate more than 200 tasks at once." },
        { status: 400 }
      );
    }

    await connectDB();

    // Tomorrow midnight UTC
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const result = await Task.updateMany(
      {
        _id: { $in: taskIds },
        userId: auth.id,
        status: { $in: ["Todo", "In-Progress"] },
      },
      { $set: { scheduledAt: tomorrow } }
    );

    // Return updated tasks so the client can hydrate its cache optimistically
    const updatedTasks = await Task.find({
      _id: { $in: taskIds },
      userId: auth.id,
    })
      .lean()
      .then((docs) => docs.map(toClientTask));

    return NextResponse.json({
      success: true,
      migratedCount: result.modifiedCount,
      tasks: updatedTasks,
    });
  } catch (error) {
    console.error("[tasks/migrate-tomorrow POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not migrate tasks." },
      { status: 500 }
    );
  }
}
