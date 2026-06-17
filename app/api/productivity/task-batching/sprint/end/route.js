import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import BatchSprintLog from "@/models/BatchSprintLog";
import { getOrCreateDashboard } from "@/lib/dashboard-utils";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { endBatchSprintSchema } from "@/lib/validations/productivity";

export const dynamic = "force-dynamic";

/**
 * POST /api/productivity/task-batching/sprint/end
 *
 * Persists batch sprint performance metadata when a sprint ends.
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

    const parsed = endBatchSprintSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const {
      batchCategory,
      bucketTitle,
      sessionStartedAt,
      durationMs,
      tasksTotal,
      tasksCompleted,
      tasksSkipped,
      focusEfficiency,
      status,
    } = parsed.data;

    const sessionLog = await BatchSprintLog.create({
      userId: auth.id,
      batchCategory,
      bucketTitle,
      sessionStartedAt: new Date(sessionStartedAt),
      durationMs,
      tasksTotal,
      tasksCompleted,
      tasksSkipped,
      focusEfficiency,
      status,
    });

    const dashboard = await getOrCreateDashboard(auth.id);
    dashboard.set("activeBatchSprint", undefined);
    await dashboard.save();

    return NextResponse.json({
      success: true,
      sessionLog: {
        id: sessionLog._id.toString(),
        batchCategory,
        bucketTitle,
        sessionStartedAt,
        durationMs,
        tasksTotal,
        tasksCompleted,
        tasksSkipped,
        focusEfficiency,
        status,
        createdAt: sessionLog.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[task-batching sprint end POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not finalize batch sprint." },
      { status: 500 }
    );
  }
}
