import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { updateBatchCategorySchema } from "@/lib/validations/productivity";
import { toClientTask } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/productivity/task-batching/category
 *
 * Assigns or clears a task's batchCategory for bucket clustering.
 */
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

    const parsed = updateBatchCategorySchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const { taskId, batchCategory } = parsed.data;

    await connectDB();

    const update =
      batchCategory === null
        ? { $unset: { batchCategory: "" } }
        : { $set: { batchCategory } };

    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId: auth.id },
      update,
      { new: true, runValidators: true, lean: true }
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found." },
        { status: 404 }
      );
    }

    const clientTask = toClientTask(task);
    if (batchCategory != null && !clientTask.batchCategory) {
      clientTask.batchCategory = batchCategory;
    }

    return NextResponse.json({ success: true, task: clientTask });
  } catch (error) {
    console.error("[task-batching category PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Could not update batch category." },
      { status: 500 }
    );
  }
}
