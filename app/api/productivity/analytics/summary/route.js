import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/api-auth";
import { buildProductivitySummary } from "@/lib/productivity-analytics";

export const dynamic = "force-dynamic";

/**
 * GET /api/productivity/analytics/summary
 *
 * Unified productivity aggregation for dashboard stats and analytics cards:
 * - Today vs rolling 7-day focus hours
 * - Focus session completion-to-abandonment ratio
 * - Estimation bias across completed tasks
 */
export async function GET(request) {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    await connectDB();

    const summary = await buildProductivitySummary(auth.id);

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[productivity analytics summary GET]", error);
    return NextResponse.json(
      { success: false, error: "Could not compute productivity summary." },
      { status: 500 }
    );
  }
}
