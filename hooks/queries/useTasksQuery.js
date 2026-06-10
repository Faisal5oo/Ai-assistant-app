"use client";

import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

export function useTasksQuery() {
  const enabled = useQueriesEnabled();

  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: async () => {
      const { tasks } = await tasksApi.list();
      return tasks;
    },
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
