import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import DeepWorkSessionLog from "@/models/DeepWorkSessionLog";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { endDeepWorkSessionSchema } from "@/lib/validations/productivity";
import { toClientTask } from "@/lib/task-serializers";
import {
  getOrCreateDashboard,
  addDailyMsToDashboard,
  serverTodayKey,
} from "@/lib/dashboard-utils";

export const dynamic = "force-dynamic";

const MS_PER_MINUTE = 60_000;

/**
 * POST /api/productivity/deep-work/session/end
 *
 * Finalizes a deep work block — writes a historical log with breakthrough
 * accuracy, friction metadata, early-achievement metrics, and optional
 * atomic task completion.
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

    const parsed = endDeepWorkSessionSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const {
      taskId,
      objective,
      plannedDurationMinutes,
      actualDurationMinutes,
      objectiveAchieved,
      status,
      abandonReason,
      completedEarly,
      minutesSaved,
      completeTask,
    } = parsed.data;

    const durationMs = Math.round(actualDurationMinutes * MS_PER_MINUTE);
    const now = new Date();

    const sessionLog = await DeepWorkSessionLog.create({
      userId: auth.id,
      taskId: taskId ?? null,
      objective,
      plannedDurationMinutes,
      actualDurationMinutes,
      objectiveAchieved: Boolean(objectiveAchieved),
      status,
      ...(abandonReason ? { abandonReason } : {}),
      completedEarly: Boolean(completedEarly),
      minutesSaved: minutesSaved ?? 0,
      createdAt: now,
    });

    /** @type {import('@/types/interfaces').Task | null} */
    let task = null;
    let dailyLogs = null;
    let deepWorkDaily = null;

    if (taskId) {
      const taskUpdate = {
        ...(durationMs > 0 ? { $inc: { actualTimeSpent: durationMs } } : {}),
        $set: { lastWorkedAt: now },
      };

      if (completeTask) {
        taskUpdate.$set.status = "Completed";
        taskUpdate.$set.completedAt = now;
        taskUpdate.$set.timeBlockAllocations = [];
        taskUpdate.$unset = { scheduledAt: "" };
      }

      const updated = await Task.findOneAndUpdate(
        { _id: taskId, userId: auth.id },
        taskUpdate,
        { new: true, runValidators: true }
      );

      if (!updated) {
        return NextResponse.json(
          { success: false, error: "Task not found." },
          { status: 404 }
        );
      }

      task = toClientTask(updated);

      const dashboard = await getOrCreateDashboard(auth.id);
      const date = serverTodayKey();

      if (durationMs > 0) {
        addDailyMsToDashboard(dashboard, date, durationMs);
      }

      if (status === "completed") {
        const current = dashboard.deepWorkDaily ?? {
          date,
          sessionsCompleted: 0,
          breakthroughsAchieved: 0,
        };

        dashboard.deepWorkDaily =
          current.date !== date
            ? {
                date,
                sessionsCompleted: 1,
                breakthroughsAchieved: objectiveAchieved ? 1 : 0,
              }
            : {
                ...current,
                sessionsCompleted: current.sessionsCompleted + 1,
                breakthroughsAchieved:
                  current.breakthroughsAchieved + (objectiveAchieved ? 1 : 0),
              };
      }

      dashboard.set("activeDeepWorkSession", undefined);
      await dashboard.save();

      dailyLogs = dashboard.dailyLogs.map((log) => ({
        date: log.date,
        totalMs: log.totalMs,
      }));
      if (dashboard.deepWorkDaily) {
        deepWorkDaily = {
          date: dashboard.deepWorkDaily.date,
          sessionsCompleted: dashboard.deepWorkDaily.sessionsCompleted,
          breakthroughsAchieved: dashboard.deepWorkDaily.breakthroughsAchieved,
        };
      }
    } else {
      const dashboard = await getOrCreateDashboard(auth.id);
      dashboard.set("activeDeepWorkSession", undefined);
      await dashboard.save();
    }

    return NextResponse.json({
      success: true,
      sessionLog: {
        id: sessionLog._id.toString(),
        taskId: taskId ?? null,
        objective,
        plannedDurationMinutes,
        actualDurationMinutes,
        objectiveAchieved: Boolean(objectiveAchieved),
        status,
        ...(abandonReason ? { abandonReason } : {}),
        completedEarly: Boolean(completedEarly),
        minutesSaved: minutesSaved ?? 0,
        createdAt: sessionLog.createdAt.toISOString(),
      },
      ...(task ? { task } : {}),
      ...(dailyLogs ? { dailyLogs } : {}),
      ...(deepWorkDaily ? { deepWorkDaily } : {}),
    });
  } catch (error) {
    console.error("[deep-work session end POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not finalize deep work session." },
      { status: 500 }
    );
  }
}
