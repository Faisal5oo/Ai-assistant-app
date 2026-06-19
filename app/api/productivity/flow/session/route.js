import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import FlowSessionLog from "@/models/FlowSessionLog";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { getOrCreateDashboard } from "@/lib/dashboard-utils";
import { toClientDashboard } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

const startFlowSessionSchema = z.object({
  primaryTaskId: z.string().min(1),
  primaryTaskTitle: z.string().min(1).max(200),
  targetTaskIds: z.array(z.string()).default([]),
  runwayQueue: z.array(z.string()).default([]),
  durationMinutes: z.number().int().min(1).max(180),
  startedAt: z.number().int().positive(),
});

const endFlowSessionSchema = z.object({
  primaryTaskId: z.string().min(1),
  primaryTaskTitle: z.string().min(1).max(200),
  targetTaskIds: z.array(z.string()).default([]),
  runwayQueue: z.array(z.string()).default([]),
  durationMinutes: z.number().int().min(1).max(180),
  actualDurationMs: z.number().int().min(0),
  status: z.enum(["completed", "abandoned"]),
  sessionStartedAt: z.string().datetime(),
});

/**
 * POST /api/productivity/flow/session
 *
 * Checkpoints the active flow session to UserDashboard.activeFlowSession
 * for cross-device session recovery.
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

    const parsed = startFlowSessionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectDB();

    const dashboard = await getOrCreateDashboard(auth.id);
    dashboard.activeFlowSession = {
      ...parsed.data,
      updatedAt: new Date(),
    };
    await dashboard.save();

    return NextResponse.json({
      success: true,
      activeFlowSession: toClientDashboard(dashboard).activeFlowSession ?? null,
    });
  } catch (error) {
    console.error("[flow session POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not checkpoint flow session." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/productivity/flow/session
 *
 * Clears activeFlowSession from UserDashboard and writes a FlowSessionLog
 * entry to the analytics layer, which increments weekly velocity.
 */
export async function DELETE(request) {
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

    const parsed = endFlowSessionSchema.safeParse(body);
    if (!parsed.success) return zodErrorResponse(parsed.error);

    await connectDB();

    const { primaryTaskId, primaryTaskTitle, targetTaskIds, runwayQueue, durationMinutes, actualDurationMs, status, sessionStartedAt } = parsed.data;

    const [dashboard] = await Promise.all([
      getOrCreateDashboard(auth.id),
    ]);

    dashboard.set("activeFlowSession", undefined);

    const logPromise = FlowSessionLog.create({
      userId: auth.id,
      primaryTaskId,
      primaryTaskTitle,
      targetTaskIds,
      runwayQueue,
      durationMinutes,
      actualDurationMs,
      status,
      sessionStartedAt: new Date(sessionStartedAt),
    });

    await Promise.all([dashboard.save(), logPromise]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[flow session DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Could not finalize flow session." },
      { status: 500 }
    );
  }
}
