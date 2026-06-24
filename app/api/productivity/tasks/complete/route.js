import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { completeTaskSchema } from "@/lib/validations/productivity";
import { toClientTask } from "@/lib/task-serializers";
import { resolveCompletionFallbackMs } from "@/lib/task-completion-time";
import { creditDashboardCompletionTime } from "@/lib/task-completion-time.server";

export const dynamic = "force-dynamic";

/**
 * POST /api/productivity/tasks/complete
 *
 * Explicit task resolution — marks a task completed without implying that
 * pomodoro investment equals task outcome. Freezes estimation vs actual metrics.
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

    const parsed = completeTaskSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const { taskId } = parsed.data;

    const existing = await Task.findOne(
      { _id: taskId, userId: auth.id },
      { status: 1, actualTimeSpent: 1, estimatedTime: 1 }
    ).lean();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    if (existing.status === "Completed") {
      const task = await Task.findOne({ _id: taskId, userId: auth.id });
      return NextResponse.json({
        success: true,
        task: toClientTask(task),
        alreadyCompleted: true,
      });
    }

    const fallbackMs = resolveCompletionFallbackMs(existing);
    const completionUpdate = {
      status: "Completed",
      completedAt: new Date(),
      timeBlockAllocations: [],
      ...(fallbackMs != null ? { actualTimeSpent: fallbackMs } : {}),
    };

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: auth.id },
      {
        $set: completionUpdate,
        $unset: { scheduledAt: "" },
      },
      { new: true, runValidators: true }
    );

    const dailyLogs =
      fallbackMs != null
        ? await creditDashboardCompletionTime(auth.id, fallbackMs)
        : null;

    return NextResponse.json({
      success: true,
      task: toClientTask(task),
      ...(dailyLogs ? { dailyLogs } : {}),
    });
  } catch (error) {
    console.error("[productivity tasks complete POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not complete task." },
      { status: 500 }
    );
  }
}
