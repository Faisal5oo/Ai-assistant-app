import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { startPomodoroSessionSchema } from "@/lib/validations/productivity";
import { toClientTask } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

/**
 * POST /api/productivity/pomodoro/session/start
 *
 * Initializes a pomodoro session. When a taskId is linked, atomically flips
 * the task to In-Progress and stamps lastWorkedAt.
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

    const parsed = startPomodoroSessionSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const { taskId, type, plannedDurationMinutes } = parsed.data;
    const sessionId = new mongoose.Types.ObjectId();
    const startedAt = new Date();

    /** @type {import('@/types/interfaces').Task | null} */
    let task = null;

    if (taskId) {
      const updated = await Task.findOneAndUpdate(
        { _id: taskId, userId: auth.id },
        {
          $set: {
            status: "In-Progress",
            lastWorkedAt: startedAt,
          },
        },
        { new: true, runValidators: true }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Task not found." },
          { status: 404 }
        );
      }

      task = toClientTask(updated);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId.toString(),
        type,
        taskId: taskId ?? null,
        startedAt: startedAt.toISOString(),
        ...(plannedDurationMinutes != null ? { plannedDurationMinutes } : {}),
      },
      ...(task ? { task } : {}),
    });
  } catch (error) {
    console.error("[pomodoro session start POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not start pomodoro session." },
      { status: 500 }
    );
  }
}
