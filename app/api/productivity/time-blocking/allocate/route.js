import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import {
  allocateTimeBlockSchema,
  deallocateTimeBlockSchema,
} from "@/lib/validations/time-blocking";
import { toClientTask } from "@/lib/task-serializers";
import { serverTodayKey } from "@/lib/dashboard-utils";
import {
  computeAllocationPlan,
  deriveScheduledAtFromAllocations,
  getEffectiveAllocations,
  getTaskRemainingMinutes,
  removeAllocation,
  SLOT_CAPACITY_MINUTES,
  upsertAllocation,
} from "@/lib/time-block-allocations";

export const dynamic = "force-dynamic";

/**
 * POST /api/productivity/time-blocking/allocate
 * Atomically reserve minutes for a task in an hour slot.
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

    const parsed = allocateTimeBlockSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const dateKey = parsed.data.date ?? serverTodayKey();
    const { taskId, hour } = parsed.data;

    const [targetTask, allTasks] = await Promise.all([
      Task.findOne({ _id: taskId, userId: auth.id }).lean(),
      Task.find({ userId: auth.id, status: { $ne: "Completed" } }).lean(),
    ]);

    if (!targetTask) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const clientTasks = allTasks.map(toClientTask);
    const clientTarget = clientTasks.find((t) => t.id === taskId);

    if (!clientTarget) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const plan = computeAllocationPlan(clientTarget, hour, clientTasks, dateKey);

    if (!plan.ok) {
      if (plan.reason === "over_capacity") {
        return NextResponse.json(
          {
            success: false,
            error: `This hour is over capacity (${plan.slotUsed}/${SLOT_CAPACITY_MINUTES}m used). Move tasks to ${plan.nextHour != null ? `the ${plan.nextHour}:00 block` : "another slot"}.`,
            code: "OVER_CAPACITY",
            slotUsed: plan.slotUsed,
            nextHour: plan.nextHour,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Task is already fully allocated on the runway.",
          code: "FULLY_ALLOCATED",
        },
        { status: 400 }
      );
    }

    const freshTasks = await Task.find({
      userId: auth.id,
      status: { $ne: "Completed" },
    }).lean();
    const freshClientTasks = freshTasks.map(toClientTask);
    const freshTarget = freshClientTasks.find((t) => t.id === taskId);

    if (!freshTarget) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const verifiedPlan = computeAllocationPlan(
      freshTarget,
      hour,
      freshClientTasks,
      dateKey
    );

    if (!verifiedPlan.ok) {
      if (verifiedPlan.reason === "over_capacity") {
        return NextResponse.json(
          {
            success: false,
            error: `This hour is over capacity (${verifiedPlan.slotUsed}/${SLOT_CAPACITY_MINUTES}m used). Move tasks to ${verifiedPlan.nextHour != null ? `the ${verifiedPlan.nextHour}:00 block` : "another slot"}.`,
            code: "OVER_CAPACITY",
            slotUsed: verifiedPlan.slotUsed,
            nextHour: verifiedPlan.nextHour,
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Task is already fully allocated on the runway.",
          code: "FULLY_ALLOCATED",
        },
        { status: 400 }
      );
    }

    const freshTargetDoc = freshTasks.find((t) => t._id.toString() === taskId);
    const existingAllocations = freshTargetDoc?.timeBlockAllocations ?? [];
    const legacyAllocations = getEffectiveAllocations(freshTarget, dateKey);

    let baseAllocations = existingAllocations.length
      ? [...existingAllocations]
      : legacyAllocations.map((a) => ({ ...a }));

    const nextAllocation = {
      date: dateKey,
      hour,
      durationMinutes: verifiedPlan.durationMinutes,
    };

    const updatedAllocations = upsertAllocation(baseAllocations, nextAllocation);
    const scheduledAt = deriveScheduledAtFromAllocations(
      updatedAllocations,
      dateKey
    );

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: auth.id, status: { $ne: "Completed" } },
      {
        $set: {
          timeBlockAllocations: updatedAllocations,
          ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        },
      },
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found or already completed." },
        { status: 404 }
      );
    }

    const serialized = toClientTask(task);

    return NextResponse.json({
      success: true,
      task: serialized,
      allocation: nextAllocation,
      remainingMinutes: getTaskRemainingMinutes(serialized, dateKey),
    });
  } catch (error) {
    console.error("[time-blocking allocate POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not allocate time block." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/productivity/time-blocking/allocate
 * Remove a task's reservation from a specific hour slot.
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

    const parsed = deallocateTimeBlockSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const dateKey = parsed.data.date ?? serverTodayKey();
    const { taskId, hour } = parsed.data;

    const existing = await Task.findOne({ _id: taskId, userId: auth.id });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    let updatedAllocations = removeAllocation(
      existing.timeBlockAllocations ?? [],
      dateKey,
      hour
    );

    if (
      updatedAllocations.length === 0 &&
      existing.scheduledAt &&
      new Date(existing.scheduledAt).getHours() === hour
    ) {
      updatedAllocations = [];
    }

    const scheduledAt = deriveScheduledAtFromAllocations(
      updatedAllocations,
      dateKey
    );

    const update =
      updatedAllocations.length > 0
        ? {
            $set: {
              timeBlockAllocations: updatedAllocations,
              ...(scheduledAt
                ? { scheduledAt: new Date(scheduledAt) }
                : { scheduledAt: null }),
            },
          }
        : {
            $set: { timeBlockAllocations: [] },
            $unset: { scheduledAt: "" },
          };

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: auth.id },
      update,
      { new: true, runValidators: true }
    );

    const serialized = toClientTask(task);

    return NextResponse.json({
      success: true,
      task: serialized,
      remainingMinutes: getTaskRemainingMinutes(serialized, dateKey),
    });
  } catch (error) {
    console.error("[time-blocking allocate DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Could not remove time block." },
      { status: 500 }
    );
  }
}
