"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

/** @typedef {{ dailyLogs: import('@/types/interfaces').DailyTimeLog[], pomodoroDaily: import('@/types/interfaces').PomodoroDaily }} DashboardData */

export function useDashboardQuery() {
  const enabled = useQueriesEnabled();

  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      const { dashboard } = await dashboardApi.get();
      return /** @type {DashboardData} */ (dashboard);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
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
    isLoading,
    isError,
    error,
    isFetching,
  };
}
