import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import PomodoroSessionLog from "@/models/PomodoroSessionLog";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { endPomodoroSessionSchema } from "@/lib/validations/productivity";
import { toClientTask } from "@/lib/task-serializers";
import {
  getOrCreateDashboard,
  addDailyMsToDashboard,
  serverTodayKey,
} from "@/lib/dashboard-utils";

export const dynamic = "force-dynamic";

const MS_PER_MINUTE = 60_000;

/**
 * POST /api/productivity/pomodoro/session/end
 *
 * Finalizes a pomodoro session — writes a historical log and, for completed
 * focus blocks, atomically increments task metrics via $inc.
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

    const parsed = endPomodoroSessionSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const { taskId, type, duration, status } = parsed.data;
    const durationMs = Math.round(duration * MS_PER_MINUTE);
    const now = new Date();

    const sessionLog = await PomodoroSessionLog.create({
      userId: auth.id,
      taskId: taskId ?? null,
      type,
      duration,
      status,
      createdAt: now,
    });

    /** @type {import('@/types/interfaces').Task | null} */
    let task = null;
    let dailyLogs = null;

    const isCompletedFocus = status === "completed" && type === "focus";

    if (taskId && isCompletedFocus && durationMs > 0) {
      const updated = await Task.findOneAndUpdate(
        { _id: taskId, userId: auth.id },
        {
          $inc: {
            completedPomodoros: 1,
            actualTimeSpent: durationMs,
          },
          $set: { lastWorkedAt: now },
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

      const dashboard = await getOrCreateDashboard(auth.id);
      const date = serverTodayKey();
      addDailyMsToDashboard(dashboard, date, durationMs);

      if (isCompletedFocus) {
        const current = dashboard.pomodoroDaily ?? {
          date,
          completed: 0,
          goal: 4,
        };

        dashboard.pomodoroDaily =
          current.date !== date
            ? { date, completed: 1, goal: current.goal ?? 4 }
            : { ...current, completed: current.completed + 1 };
      }

      await dashboard.save();
      dailyLogs = dashboard.dailyLogs.map((log) => ({
        date: log.date,
        totalMs: log.totalMs,
      }));
    } else if (taskId && durationMs > 0) {
      const updated = await Task.findOneAndUpdate(
        { _id: taskId, userId: auth.id },
        {
          $inc: { actualTimeSpent: durationMs },
          $set: { lastWorkedAt: now },
        },
        { new: true, runValidators: true }
      );

      if (updated) {
        task = toClientTask(updated);

        const dashboard = await getOrCreateDashboard(auth.id);
        addDailyMsToDashboard(dashboard, serverTodayKey(), durationMs);
        await dashboard.save();
        dailyLogs = dashboard.dailyLogs.map((log) => ({
          date: log.date,
          totalMs: log.totalMs,
        }));
      }
    }

    const dashboard = await getOrCreateDashboard(auth.id);
    dashboard.set("activePomodoroTimer", undefined);
    await dashboard.save();

    return NextResponse.json({
      success: true,
      sessionLog: {
        id: sessionLog._id.toString(),
        taskId: taskId ?? null,
        type,
        duration,
        status,
        createdAt: sessionLog.createdAt.toISOString(),
      },
      ...(task ? { task } : {}),
      ...(dailyLogs ? { dailyLogs } : {}),
    });
  } catch (error) {
    console.error("[pomodoro session end POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not finalize pomodoro session." },
      { status: 500 }
    );
  }
}
