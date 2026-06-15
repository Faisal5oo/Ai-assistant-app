"use client";

import { useEffect } from "react";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useCurrentClock } from "@/hooks/useCurrentClock";
import { getInProgressTopTask } from "@/lib/focusQueue";
import { hoistRunwayPrimaryImperative } from "@/lib/hoistRunwayPrimaryImperative";
import { getRunwayPrimaryAllocation } from "@/lib/runway-focus";
import { getCurrentHour } from "@/lib/timeBlocking";
import { useTaskStore } from "@/store/useTaskStore";

/**
 * At each hour boundary, visually take over the dashboard queue by hoisting
 * runway tasks to In-Progress top — without auto-starting the focus timer.
 */
export function useRunwayHourConductor() {
  const { tasks } = useTasks();
  const now = useCurrentClock(15000);
  const currentHour = getCurrentHour(now);
  const setRunwayLiveHour = useTaskStore((s) => s.setRunwayLiveHour);

  useEffect(() => {
    const primary = getRunwayPrimaryAllocation(tasks, currentHour);

    if (!primary) {
      setRunwayLiveHour(null);
      return;
    }

    setRunwayLiveHour(currentHour);

    const inProgressTop = getInProgressTopTask(tasks);
    if (inProgressTop?.id !== primary.task.id) {
      hoistRunwayPrimaryImperative(currentHour).catch(() => {});
    }
  }, [currentHour, tasks, setRunwayLiveHour]);
}
