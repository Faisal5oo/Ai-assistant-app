import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { createTaskSchema } from "@/lib/validations/task";
import { toClientTask } from "@/lib/task-serializers";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    await connectDB();

    const tasks = await Task.find({ userId: auth.id })
      .sort({ status: 1, sortOrder: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      tasks: tasks.map(toClientTask),
    });
  } catch (error) {
    console.error("[tasks GET]", error);
    return NextResponse.json(
      { success: false, error: "Could not load tasks." },
      { status: 500 }
    );
  }
}

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

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    await connectDB();

    const maxOrder = await Task.findOne({ userId: auth.id, status: "Todo" })
      .sort({ sortOrder: -1 })
      .select("sortOrder")
      .lean();

    const data = parsed.data;

    const task = await Task.create({
      userId: auth.id,
      title: data.title,
      category: data.category,
      priority: data.priority,
      status: "Todo",
      estimatedTime: data.estimatedTime,
      actualTimeSpent: 0,
      tags: data.tags,
      ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
      ...(data.description ? { description: data.description } : {}),
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    });

    return NextResponse.json(
      { success: true, task: toClientTask(task) },
      { status: 201 }
    );
  } catch (error) {
    console.error("[tasks POST]", error);
    return NextResponse.json(
      { success: false, error: "Could not create task." },
      { status: 500 }
    );
  }
}
