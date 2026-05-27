"use client";

import { useMemo } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { CategoryChart } from "@/components/analytics/CategoryChart";
import { EstimatedVsActual } from "@/components/analytics/EstimatedVsActual";
import { FocusScoreCard } from "@/components/analytics/FocusScoreCard";
import { WeeklyProgressChart } from "@/components/dashboard/WeeklyProgressChart";

export default function AnalyticsPage() {
  const tasks = useTaskStore((s) => s.tasks);

  const dataByCategory = useMemo(() => {
    /** @type {Record<string, number>} */
    const map = {};
    tasks.forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.actualTimeSpent;
    });
    return map;
  }, [tasks]);

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-semibold">
        Analytics & Insights
      </h1>
      <p className="mb-8 text-sm text-charcoal/50">
        Understand where your time goes and how accurately you estimate work.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        <FocusScoreCard />
        <CategoryChart dataByCategory={dataByCategory} />
        <WeeklyProgressChart />
        <EstimatedVsActual />
      </div>
    </div>
  );
}
