import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAuth } from "@/lib/api-auth";
import { buildAnalyticsPayload } from "@/lib/analytics-pipeline";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  range: z.enum(["week", "month"]).default("week"),
});

/**
 * GET /api/analytics?range=week|month
 *
 * Returns a fully structured analytics payload covering:
 *  - Focus Score (0-100) with component breakdown
 *  - Time by Category (ms + hours per category)
 *  - Daily timeline distribution (7 or 30 data points)
 *  - Estimated vs. Actual per-task deltas
 *  - Period-over-period velocity deltas
 *  - AI/LLM-ready context block
 *
 * Security: strict session enforcement — query is always scoped to the
 * authenticated user's ObjectId; cross-tenant leakage is structurally impossible.
 */
export async function GET(request) {
  try {
    // ── Auth guard ───────────────────────────────────────────────────────────
    const auth = await requireAuth(request);
    if (auth instanceof NextResponse) return auth;

    // ── Input validation ─────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({ range: searchParams.get("range") ?? "week" });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid query parameters.",
        },
        { status: 400 }
      );
    }

    const { range } = parsed.data;

    // ── DB connection ────────────────────────────────────────────────────────
    await connectDB();

    // ── Aggregation — userId is pinned to session; cannot be overridden ──────
    const payload = await buildAnalyticsPayload(auth.id, range);

    return NextResponse.json({ success: true, analytics: payload });
  } catch (error) {
    console.error("[analytics GET]", error);
    return NextResponse.json(
      { success: false, error: "Could not compute analytics." },
      { status: 500 }
    );
  }
}
