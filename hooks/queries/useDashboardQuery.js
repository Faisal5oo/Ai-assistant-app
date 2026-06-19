"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

/**
 * @typedef {{ matched: number, total: number }} WellnessStat
 * @typedef {{
 *   hydration: WellnessStat,
 *   stretching: WellnessStat,
 *   phoneAvoidance: WellnessStat,
 * }} WellnessStats
 *
 * @typedef {{
 *   dailyLogs: import('@/types/interfaces').DailyTimeLog[],
 *   pomodoroDaily: import('@/types/interfaces').PomodoroDaily,
 *   sessionFocusScore: number | null,
 *   activeTimeBlock: object | null,
 *   wellnessStats: WellnessStats | null,
 * }} DashboardData
 */

/** @returns {WellnessStats} */
function emptyWellness() {
  return {
    hydration: { matched: 0, total: 0 },
    stretching: { matched: 0, total: 0 },
    phoneAvoidance: { matched: 0, total: 0 },
  };
}

export function useDashboardQuery() {
  const enabled = useQueriesEnabled();

  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const res = await fetch("/api/dashboard", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        const err = new Error(
          typeof data.error === "string" ? data.error : "Could not load dashboard."
        );
        throw err;
      }
      return /** @type {DashboardData} */ ({
        ...(data.dashboard ?? {}),
        activeTimeBlock: data.activeTimeBlock ?? null,
      });
    },
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
}

export function useDashboard() {
  const { data, isLoading, isError, error, isFetching } = useDashboardQuery();

  return {
    dailyLogs: data?.dailyLogs ?? [],
    pomodoroDaily: data?.pomodoroDaily ?? {
      date: new Date().toISOString().slice(0, 10),
      completed: 0,
      goal: 4,
    },
    sessionFocusScore: data?.sessionFocusScore ?? null,
    activeTimeBlock: data?.activeTimeBlock ?? null,
    wellnessStats: data?.wellnessStats ?? null,
    isLoading,
    isError,
    error,
    isFetching,
  };
}
