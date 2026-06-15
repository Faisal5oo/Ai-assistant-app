import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { updateDashboardSchema } from "@/lib/validations/dashboard";
import { toClientDashboard, toClientTask } from "@/lib/task-serializers";
import {
  getOrCreateDashboard,
  addDailyMsToDashboard,
  serverTodayKey,
} from "@/lib/dashboard-utils";
import { getSlotAllocations } from "@/lib/time-block-allocations";
import { formatHourRangeLabel } from "@/lib/timeBlocking";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    await connectDB();

    const dashboard = await getOrCreateDashboard(auth.id);
    const dateKey = serverTodayKey();
    const currentHour = new Date().getHours();

    const openTasks = await Task.find({
      userId: auth.id,
      status: { $ne: "Completed" },
    }).lean();

    const clientTasks = openTasks.map(toClientTask);
    const allocations = getSlotAllocations(clientTasks, currentHour, dateKey);

    const activeTimeBlock =
      allocations.length > 0
        ? {
            date: dateKey,
            hour: currentHour,
            rangeLabel: formatHourRangeLabel(currentHour),
            tasks: allocations.map(({ task, durationMinutes }) => ({
              taskId: task.id,
              title: task.title,
              category: task.category,
              priority: task.priority,
              durationMinutes,
            })),
          }
        : null;

    return NextResponse.json({
      success: true,
      dashboard: toClientDashboard(dashboard),
      activeTimeBlock,
    });
  } catch (error) {
    console.error("[dashboard GET]", error);
    return NextResponse.json(
      { success: false, error: "Could not load dashboard." },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
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

    const parsed = updateDashboardSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const dashboard = await getOrCreateDashboard(auth.id);
    const { addDailyMs, pomodoroDaily, pomodoroIncrement, activeFocusSession, activeDeepWorkSession, deepWorkDaily } =
      parsed.data;

    if (addDailyMs) {
      addDailyMsToDashboard(dashboard, addDailyMs.date, addDailyMs.ms);
    }

    if (pomodoroDaily) {
      dashboard.pomodoroDaily = pomodoroDaily;
    }

    if (activeFocusSession === null) {
      dashboard.set("activeFocusSession", undefined);
    } else if (activeFocusSession) {
      dashboard.activeFocusSession = {
        ...activeFocusSession,
        updatedAt: new Date(),
      };
    }

    if (activeDeepWorkSession === null) {
      dashboard.set("activeDeepWorkSession", undefined);
    } else if (activeDeepWorkSession) {
      dashboard.activeDeepWorkSession = {
        ...activeDeepWorkSession,
        updatedAt: new Date(),
      };
    }

    if (deepWorkDaily) {
      dashboard.deepWorkDaily = deepWorkDaily;
    }

    if (pomodoroIncrement) {
      const today = pomodoroIncrement.date;
      const current = dashboard.pomodoroDaily ?? {
        date: today,
        completed: 0,
        goal: pomodoroIncrement.goal ?? 4,
      };

      if (current.date !== today) {
        dashboard.pomodoroDaily = {
          date: today,
          completed: 1,
          goal: pomodoroIncrement.goal ?? current.goal ?? 4,
        };
      } else {
        dashboard.pomodoroDaily = {
          date: today,
          completed: current.completed + 1,
          goal: pomodoroIncrement.goal ?? current.goal ?? 4,
        };
      }
    }

    await dashboard.save();

    return NextResponse.json({
      success: true,
      dashboard: toClientDashboard(dashboard),
    });
  } catch (error) {
    console.error("[dashboard PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Could not update dashboard." },
      { status: 500 }
    );
  }
}
