"use client";

import { useMemo, useState } from "react";
import { useAnalytics } from "@/hooks/queries/useAnalyticsQuery";
import { useDashboard } from "@/hooks/queries/useDashboardQuery";
import { useProductivitySummary } from "@/hooks/queries/useProductivitySummaryQuery";
import {
  buildMonthlyProgressTimeline,
  buildWeeklyProgressTimeline,
  formatWeekRangeLabel,
} from "@/lib/progress-timeline";
import { CategoryChart } from "@/components/analytics/CategoryChart";
import { EstimatedVsActual } from "@/components/analytics/EstimatedVsActual";
import { EnergyCyclesCard } from "@/components/analytics/EnergyCyclesCard";
import { FocusScoreCard } from "@/components/analytics/FocusScoreCard";
import { ProgressChart } from "@/components/analytics/ProgressChart";

export default function AnalyticsPage() {
  const [range, setRange] = useState(/** @type {"week"|"month"} */ ("week"));
  const [weekOffset, setWeekOffset] = useState(0);
  const { analytics, isLoading } = useAnalytics(range);
  const { dailyLogs, isLoading: dashboardLoading } = useDashboard();
  const { summary, isLoading: summaryLoading } = useProductivitySummary();

  const progressData = useMemo(() => {
    if (range === "month") {
      return buildMonthlyProgressTimeline(dailyLogs);
    }
    return buildWeeklyProgressTimeline(dailyLogs, weekOffset);
  }, [dailyLogs, range, weekOffset]);

  const weekRangeLabel =
    range === "week" && weekOffset !== 0
      ? formatWeekRangeLabel(progressData.weekStart, progressData.weekEnd)
      : undefined;

  const dataByCategory = Object.fromEntries(
    Object.entries(analytics.timeByCategory).map(([k, v]) => [k, v.totalMs])
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 font-display text-3xl font-semibold">
            Analytics &amp; Insights
          </h1>
          <p className="text-sm text-charcoal/50">
            Understand where your time goes and how accurately you estimate work.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-charcoal/5 p-1">
          {(/** @type {Array<"week"|"month">} */ (["week", "month"])).map((r) => (
            <button
              key={r}
              onClick={() => {
                setRange(r);
                if (r === "week") setWeekOffset(0);
              }}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                range === r
                  ? "bg-charcoal text-white"
                  : "text-charcoal/60 hover:text-charcoal"
              }`}
            >
              {r === "week" ? "Weekly" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <FocusScoreCard
          focusScore={analytics.summary.currentFocusScore}
          scoreComponents={analytics.scoreComponents}
          taskCounts={analytics.taskCounts}
          scoreDeltaPct={analytics.summary.scoreDeltaPct}
          isLoading={isLoading}
        />
        <CategoryChart
          dataByCategory={dataByCategory}
          isLoading={isLoading}
        />
        <ProgressChart
          timeline={progressData.timeline}
          totalTrackedHours={progressData.totalHours}
          range={range}
          isLoading={dashboardLoading}
          weekOffset={weekOffset}
          onWeekOffsetChange={range === "week" ? setWeekOffset : undefined}
          weekRangeLabel={weekRangeLabel}
        />
        <EstimatedVsActual
          tasks={analytics.estimatedVsActual}
          estimationTotals={{
            ...analytics.estimationTotals,
            ...(summary.estimationBias.accuracyScore != null
              ? {
                  biasLabel:
                    summary.estimationBias.deltaPct == null
                      ? analytics.estimationTotals.biasLabel
                      : summary.estimationBias.deltaPct > 5
                        ? `underestimated_by_${Math.abs(Math.round(summary.estimationBias.deltaPct))}_percent`
                        : summary.estimationBias.deltaPct < -5
                          ? `overestimated_by_${Math.abs(Math.round(summary.estimationBias.deltaPct))}_percent`
                          : "on_target",
                }
              : {}),
          }}
          isLoading={isLoading || summaryLoading}
        />
        <EnergyCyclesCard
          energyCycles={summary.deepWork.energyCycles}
          earlyCompletions={summary.deepWork.earlyCompletions}
          totalMinutesSaved={summary.deepWork.totalMinutesSaved}
          isLoading={summaryLoading}
        />
      </div>
    </div>
  );
}
