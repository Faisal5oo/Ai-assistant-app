"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTasksQuery } from "@/hooks/queries/useTasksQuery";
import {
  readDeepWorkSessionFromStorage,
  toDeepWorkSessionFromPersisted,
} from "@/lib/deepWorkSessionStorage";
import {
  checkpointDeepWorkSession,
  purgeDeepWorkSession,
} from "@/lib/deepWorkSessionSync";

/**
 * Checkpoints deep work session on tab close only — no polling interval.
 */
export function DeepWorkPersistenceBridge() {
  const pathname = usePathname();
  const { data: tasks, isSuccess: tasksReady } = useTasksQuery();

  useEffect(() => {
    if (!pathname?.startsWith("/productivity/deep-work")) return undefined;

    const onBeforeUnload = () => {
      const persisted = readDeepWorkSessionFromStorage();
      if (!persisted?.sessionId) return;
      checkpointDeepWorkSession(
        toDeepWorkSessionFromPersisted(persisted),
        persisted.phase,
        persisted.distractions ?? []
      );
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [pathname]);

  useEffect(() => {
    if (!tasksReady || !tasks?.length) return;
    const persisted = readDeepWorkSessionFromStorage();
    if (persisted?.taskId && !tasks.some((t) => t.id === persisted.taskId)) {
      purgeDeepWorkSession();
    }
  }, [tasksReady, tasks]);

  return null;
}
