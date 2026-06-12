"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

/**
 * Fetches the server-computed analytics payload for the given range.
 * Data is stale-while-revalidate with a 2-minute cache.
 *
 * @param {"week"|"month"} range
 */
export function useAnalyticsQuery(range = "week") {
  const enabled = useQueriesEnabled();

  return useQuery({
    queryKey: queryKeys.analytics(range),
    queryFn: async () => {
      const { analytics } = await analyticsApi.get(range);
      return analytics;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Safe-default zero metrics shape — used before data loads or on empty state. */
const EMPTY_ANALYTICS = {
  range: "week",
  window: { start: null, end: null, days: 7 },
  summary: {
    currentFocusScore: 0,
    previousFocusScore: 0,
    scoreDeltaPct: null,
    currentTotalHours: 0,
    previousTotalHours: 0,
    hoursDeltaPct: null,
    currentCompletedTasks: 0,
    previousCompletedTasks: 0,
    completionDeltaPct: null,
  },
  scoreComponents: { completionRate: 0, accuracyRate: 0, highPriorityRate: 0 },
  taskCounts: { total: 0, completed: 0, withinEstimate: 0, highTotal: 0, highCompleted: 0 },
  timeByCategory: {
    Work: { totalMs: 0, totalHours: 0 },
    Personal: { totalMs: 0, totalHours: 0 },
    Learning: { totalMs: 0, totalHours: 0 },
    Health: { totalMs: 0, totalHours: 0 },
  },
  totalTrackedMs: 0,
  totalTrackedHours: 0,
  timeline: [],
  estimatedVsActual: [],
  estimationTotals: { totalEstimatedMs: 0, totalActualMs: 0, biasLabel: "insufficient_data" },
  aiContext: {
    mostProductiveDayOfWeek: null,
    highestTimeSinkCategory: null,
    estimationBias: "insufficient_data",
    velocityTrend: "no_baseline",
    focusTrend: "no_baseline",
  },
};

/**
 * Convenience hook that exposes analytics data with safe defaults.
 * @param {"week"|"month"} range
 */
export function useAnalytics(range = "week") {
  const { data, isLoading, isError, error, isFetching } = useAnalyticsQuery(range);

  return {
    analytics: data ?? EMPTY_ANALYTICS,
    isLoading,
    isError,
    error,
    isFetching,
  };
}
