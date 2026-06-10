import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { addTimeSchema } from "@/lib/validations/task";
import { toClientTask } from "@/lib/task-serializers";
import {
  getOrCreateDashboard,
  addDailyMsToDashboard,
  serverTodayKey,
} from "@/lib/dashboard-utils";

export const dynamic = "force-dynamic";

/**
 * @param {import('next/server').NextRequest} request
 * @param {{ params: { id: string } }} context
 */
export async function POST(request, { params }) {
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

    const parsed = addTimeSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const date = parsed.data.date ?? serverTodayKey();
    const { durationMs } = parsed.data;

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: auth.id },
      { $inc: { actualTimeSpent: durationMs } },
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const dashboard = await getOrCreateDashboard(auth.id);
    addDailyMsToDashboard(dashboard, date, durationMs);
    await dashboard.save();

    return NextResponse.json({
      success: true,
      task: toClientTask(task),
      dailyLogs: dashboard.dailyLogs.map((log) => ({
        date: log.date,
        totalMs: log.totalMs,
      })),
    });
  } catch (error) {
    console.error("[tasks time POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not record time." },
      { status: 500 }
    );
  }
}
