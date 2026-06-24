"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api-client";
import { getClientLocalDayParams } from "@/lib/local-day-bounds";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

/** @returns {Promise<import('@/types/interfaces').Task[]>} */
export async function fetchTodayTasks() {
  const day = getClientLocalDayParams();
  const { tasks } = await tasksApi.list({
    scope: "today",
    localDate: day.localDate,
    tzOffset: day.tzOffset,
  });
  return tasks;
}

/** @returns {Promise<import('@/types/interfaces').Task[]>} */
export async function fetchArchivedTasks() {
  const day = getClientLocalDayParams();
  const { tasks } = await tasksApi.list({
    scope: "archived",
    localDate: day.localDate,
    tzOffset: day.tzOffset,
  });
  return tasks;
}

export function useTasksQuery() {
  const enabled = useQueriesEnabled();

  return useQuery({
    queryKey: queryKeys.tasks("today"),
    queryFn: fetchTodayTasks,
    enabled,
  });
}

/** @returns {{ tasks: import('@/types/interfaces').Task[], isLoading: boolean, isError: boolean, error: Error | null, isFetching: boolean }} */
export function useTasks() {
  const { data, isLoading, isError, error, isFetching } = useTasksQuery();
  return {
    tasks: data ?? [],
    isLoading,
    isError,
    error,
    isFetching,
  };
}

/**
 * Historical completed tasks — lazy-loaded for the Kanban archive accordion.
 * @param {{ enabled?: boolean }} [options]
 */
export function useArchivedTasksQuery(options = {}) {
  const queriesEnabled = useQueriesEnabled();
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.tasks("archived"),
    queryFn: fetchArchivedTasks,
    enabled: queriesEnabled && enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** @returns {{ archivedTasks: import('@/types/interfaces').Task[], isLoading: boolean, isFetching: boolean }} */
export function useArchivedTasks(options = {}) {
  const { data, isLoading, isFetching } = useArchivedTasksQuery(options);
  return {
    archivedTasks: data ?? [],
    isLoading,
    isFetching,
  };
}
