import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth } from "@/lib/api-auth";
import { toClientDashboard, toClientTask } from "@/lib/task-serializers";
import { getOrCreateDashboard, serverTodayKey } from "@/lib/dashboard-utils";
import { getSlotAllocations } from "@/lib/time-block-allocations";
import { formatHourRangeLabel } from "@/lib/timeBlocking";

export const dynamic = "force-dynamic";

/**
 * GET /api/productivity/sync/active-workspace
 *
 * Returns all cross-device active workspace fields for mount reconciliation.
 */
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

    const clientDashboard = toClientDashboard(dashboard);

    return NextResponse.json({
      success: true,
      workspace: {
        activeFocusSession: clientDashboard.activeFocusSession ?? null,
        activeDeepWorkSession: clientDashboard.activeDeepWorkSession ?? null,
        activeBatchSprint: clientDashboard.activeBatchSprint ?? null,
        activePomodoroTimer: clientDashboard.activePomodoroTimer ?? null,
        activeTimeBlockRunway: clientDashboard.activeTimeBlockRunway ?? null,
        activeTimeBlock,
      },
    });
  } catch (error) {
    console.error("[active-workspace GET]", error);
    return NextResponse.json(
      { success: false, error: "Could not load active workspace." },
      { status: 500 }
    );
  }
}
