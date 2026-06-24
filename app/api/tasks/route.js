import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { requireAuth, zodErrorResponse } from "@/lib/api-auth";
import { createTaskSchema } from "@/lib/validations/task";
import { taskListQuerySchema } from "@/lib/validations/task-list-query";
import { toClientTask } from "@/lib/task-serializers";
import { serverTodayKey } from "@/lib/dashboard-utils";
import {
  buildArchivedCompletedFilter,
  buildTodayScopeTaskFilter,
} from "@/lib/task-query-filters";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const parsed = taskListQuerySchema.safeParse({
      scope: searchParams.get("scope") ?? "today",
      date: searchParams.get("date") ?? undefined,
      tzOffset: searchParams.get("tzOffset") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid query parameters.",
        },
        { status: 400 }
      );
    }

    const { scope } = parsed.data;
    const localDate = parsed.data.date ?? serverTodayKey();
    const tzOffset = parsed.data.tzOffset ?? 0;

    await connectDB();

    const filter =
      scope === "archived"
        ? buildArchivedCompletedFilter(auth.id, localDate, tzOffset)
        : buildTodayScopeTaskFilter(auth.id, localDate, tzOffset);

    const sort =
      scope === "archived"
        ? { completedAt: -1, createdAt: -1 }
        : { status: 1, sortOrder: 1, createdAt: 1 };

    const tasks = await Task.find(filter).sort(sort).lean();

    return NextResponse.json({
      success: true,
      tasks: tasks.map(toClientTask),
      scope,
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
