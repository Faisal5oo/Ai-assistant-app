import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { updateTaskSchema } from "@/lib/validations/task";
import { toClientTask } from "@/lib/task-serializers";
import { resolveCompletionFallbackOnTransition } from "@/lib/task-completion-time";
import { creditDashboardCompletionTime } from "@/lib/task-completion-time.server";

export const dynamic = "force-dynamic";

/**
 * @param {Record<string, unknown>} updates
 * @param {import('mongoose').Document | null} existingTask - existing task for transition detection
 */
function buildMongoUpdate(updates, existingTask) {
  /** @type {Record<string, unknown>} */
  const $set = {};
  /** @type {Record<string, "">} */
  const $unset = {};

  for (const [key, value] of Object.entries(updates)) {
    if (value === null) {
      $unset[key] = "";
      continue;
    }

    if (key === "scheduledAt" && typeof value === "string") {
      $set[key] = new Date(value);
      continue;
    }

    if (key === "timeBlockAllocations" && Array.isArray(value)) {
      $set[key] = value;
      continue;
    }

    if (key === "lastWorkedAt" && typeof value === "string") {
      $set[key] = new Date(value);
      continue;
    }

    $set[key] = value;
  }

  // Auto-stamp completedAt when transitioning to Completed
  if (updates.status === "Completed" && existingTask?.status !== "Completed") {
    $set.completedAt = new Date();
  } else if (updates.status && updates.status !== "Completed" && existingTask?.status === "Completed") {
    $unset.completedAt = "";
  }

  return {
    ...(Object.keys($set).length ? { $set } : {}),
    ...(Object.keys($unset).length ? { $unset } : {}),
  };
}

/**
 * @param {import('next/server').NextRequest} request
 * @param {{ params: { id: string } }} context
 */
export async function PATCH(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task id is required." },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid request body." },
        { status: 400 }
      );
    }

    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const existingTask = await Task.findOne(
      { _id: id, userId: auth.id },
      { status: 1, actualTimeSpent: 1, estimatedTime: 1 }
    ).lean();

    const isTransitionToCompleted =
      parsed.data.status === "Completed" && existingTask?.status !== "Completed";

    const fallbackMs = resolveCompletionFallbackOnTransition(
      isTransitionToCompleted,
      existingTask,
      parsed.data
    );

    if (fallbackMs != null) {
      parsed.data.actualTimeSpent = fallbackMs;
    }

    const mongoUpdate = buildMongoUpdate(parsed.data, existingTask);
    if (!mongoUpdate.$set && !mongoUpdate.$unset) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: auth.id },
      mongoUpdate,
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

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
    console.error("[tasks PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Could not update task." },
      { status: 500 }
    );
  }
}

/**
 * @param {import('next/server').NextRequest} request
 * @param {{ params: { id: string } }} context
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Task id is required." },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await Task.deleteOne({ _id: id, userId: auth.id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[tasks DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Could not delete task." },
      { status: 500 }
    );
  }
}
