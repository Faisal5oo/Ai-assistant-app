"use client";

import { useQuery } from "@tanstack/react-query";
import { productivityApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

/** @type {import('@/types/interfaces').ProductivitySummary} */
const EMPTY_SUMMARY = {
  focusHours: {
    today: 0,
    todayMinutes: 0,
    rollingSevenDay: [],
  },
  sessionCompletion: {
    completed: 0,
    abandoned: 0,
    completionRatio: null,
  },
  estimationBias: {
    completedTaskCount: 0,
    totalEstimatedMinutes: 0,
    totalEstimatedHours: 0,
    totalActualMs: 0,
    totalActualHours: 0,
    deltaMs: 0,
    deltaPct: null,
    accuracyScore: null,
  },
  deepWork: {
    todaySessions: 0,
    todayBreakthroughs: 0,
    breakthroughAccuracy: null,
    currentStreak: 0,
    earlyCompletions: 0,
    totalMinutesSaved: 0,
    energyCycles: {
      cognitiveDepletion: 0,
      externalFriction: 0,
      dopaminePull: 0,
      total: 0,
    },
    rollingSevenDay: [],
  },
  generatedAt: "",
};

export function useProductivitySummaryQuery() {
  const enabled = useQueriesEnabled();

  return useQuery({
    queryKey: queryKeys.productivitySummary,
    queryFn: async () => {
      const { summary } = await productivityApi.getSummary();
      return summary;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useProductivitySummary() {
  const { data, isLoading, isError, error, isFetching, refetch } =
    useProductivitySummaryQuery();

  return {
    summary: data ?? EMPTY_SUMMARY,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  };
}
