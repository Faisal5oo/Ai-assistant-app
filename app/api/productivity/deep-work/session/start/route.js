import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { startDeepWorkSessionSchema } from "@/lib/validations/productivity";
import { toClientTask } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

/**
 * POST /api/productivity/deep-work/session/start
 *
 * Commits pre-flight metadata, flips the target task to In-Progress,
 * and returns a session envelope for client-side timer orchestration.
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

    const parsed = startDeepWorkSessionSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const { taskId, objective, plannedDurationMinutes } = parsed.data;
    const sessionId = new mongoose.Types.ObjectId();
    const startedAt = new Date();

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

    return NextResponse.json({
      success: true,
      session: {
        id: sessionId.toString(),
        taskId,
        objective,
        plannedDurationMinutes,
        committedAt: startedAt.toISOString(),
      },
      task: toClientTask(updated),
    });
  } catch (error) {
    console.error("[deep-work session start POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not start deep work session." },
      { status: 500 }
    );
  }
}
