"use client";

import { useEffect, useRef } from "react";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useCurrentClock } from "@/hooks/useCurrentClock";
import { todayKey } from "@/lib/utils";
import {
  getUpcomingRunwayAlert,
  runwayAlertStorageKey,
} from "@/lib/runway-focus";
import { playRunwayAlertChime } from "@/lib/runway-alert-sound";
import { appToast } from "@/lib/toast";

/**
 * Notify the user 2–5 minutes before an allocated runway hour begins.
 */
export function useRunwayBlockAlerts() {
  const { tasks } = useTasks();
  const now = useCurrentClock(30000);
  const permissionRequestedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const alert = getUpcomingRunwayAlert(now, tasks, todayKey());
    if (!alert) return;

    const storageKey = runwayAlertStorageKey(todayKey(), alert.hour);
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");

    const primary = alert.allocations[0];
    const title = primary?.task.title ?? "Runway block";
    const body = `${alert.rangeLabel} starts in ~${alert.minutesUntil} min — ${title} is on your runway.`;

    playRunwayAlertChime();

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Runway block approaching", {
          body,
          tag: storageKey,
          icon: "/favicon.ico",
        });
      } catch {
        appToast.info(body, "Runway block soon");
      }
    } else {
      appToast.info(body, "Runway block soon");
    }
  }, [now, tasks]);
}
