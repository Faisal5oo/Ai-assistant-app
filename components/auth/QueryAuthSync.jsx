"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { fetchTodayTasks } from "@/hooks/queries/useTasksQuery";
import { queryKeys } from "@/lib/query-keys";
import { useQueriesEnabled } from "@/hooks/useQueriesEnabled";

export function QueryAuthSync() {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const enabled = useQueriesEnabled();

  useEffect(() => {
    if (pathname?.startsWith("/auth")) {
      queryClient.removeQueries();
      return undefined;
    }

    if (!enabled) {
      return undefined;
    }

    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks("today"),
      queryFn: fetchTodayTasks,
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard,
      queryFn: async () => {
        const res = await fetch("/api/dashboard", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Could not load dashboard.");
        }
        return data.dashboard;
      },
    });

    return undefined;
  }, [pathname, enabled, queryClient]);

  return null;
}
