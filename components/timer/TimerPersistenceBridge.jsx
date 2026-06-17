"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  readFocusSessionFromStorage,
  toActiveTimerFromPersisted,
  writeFocusSessionToStorage,
} from "@/lib/focusSessionStorage";
import {
  mirrorFocusSessionLocal,
  snapshotRunningSession,
} from "@/lib/focusSessionSync";
import {
  reconcileFocusSession,
  shouldPreferRemote,
  recalculateFocusSession,
} from "@/lib/workspaceReconciliation";
import { fetchActiveWorkspace, checkpointFocusSessionRemote } from "@/lib/workspaceSync";
import { useTasksQuery } from "@/hooks/queries/useTasksQuery";
import { clearActiveTimer } from "@/lib/taskStatusTimerSync";
import { useTaskStore } from "@/store/useTaskStore";

const RUNNING_SNAPSHOT_MS = 2000;

/**
 * Hydrates focus timer from storage/backend and mirrors live state locally.
 * No UI — avoids layout jitter in header or Time Tracker.
 */
export function TimerPersistenceBridge() {
  const pathname = usePathname();
  const { data: tasks, isSuccess: tasksReady } = useTasksQuery();
  const hydratedRef = useRef(false);
  const skipMirrorRef = useRef(false);

  useEffect(() => {
    if (pathname?.startsWith("/auth")) return undefined;
    if (hydratedRef.current) return undefined;
    hydratedRef.current = true;

    let cancelled = false;

    const applySession = (session) => {
      if (!session?.taskId || cancelled) return;
      skipMirrorRef.current = true;
      useTaskStore.setState({
        activeTimer: toActiveTimerFromPersisted(session),
        activeTechnique: session.activeTechnique ?? null,
      });
      writeFocusSessionToStorage(
        toActiveTimerFromPersisted(session),
        session.activeTechnique ?? null
      );
      skipMirrorRef.current = false;
    };

    const hydrate = async () => {
      const local = readFocusSessionFromStorage();

      try {
        const workspace = await fetchActiveWorkspace();
        if (cancelled) return;

        const remote = workspace.activeFocusSession ?? null;
        const winner = reconcileFocusSession(local, remote);

        if (winner) {
          applySession(winner);
          if (local && remote && !shouldPreferRemote(local, remote)) {
            checkpointFocusSessionRemote(recalculateFocusSession(local));
          }
          return;
        }

        if (local?.taskId) {
          applySession(recalculateFocusSession(local));
          checkpointFocusSessionRemote(recalculateFocusSession(local));
        }
      } catch {
        if (local?.taskId) {
          applySession(recalculateFocusSession(local));
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname?.startsWith("/auth")) return undefined;

    const unsubscribe = useTaskStore.subscribe((state, prev) => {
      if (skipMirrorRef.current) return;
      if (state.activeTimer === prev.activeTimer) return;
      mirrorFocusSessionLocal(state.activeTimer, state.activeTechnique);
    });

    const runningInterval = setInterval(() => {
      const { activeTimer, activeTechnique } = useTaskStore.getState();
      if (activeTimer.isRunning && activeTimer.taskId) {
        snapshotRunningSession(activeTimer, activeTechnique);
      }
    }, RUNNING_SNAPSHOT_MS);

    const onBeforeUnload = () => {
      const { activeTimer, activeTechnique } = useTaskStore.getState();
      if (!activeTimer.taskId) return;
      if (activeTimer.isRunning) {
        snapshotRunningSession(activeTimer, activeTechnique);
      } else {
        mirrorFocusSessionLocal(activeTimer, activeTechnique);
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      unsubscribe();
      clearInterval(runningInterval);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [pathname]);

  useEffect(() => {
    if (!tasksReady || !tasks?.length) return;
    const { activeTimer } = useTaskStore.getState();
    if (
      activeTimer.taskId &&
      !tasks.some((t) => t.id === activeTimer.taskId)
    ) {
      clearActiveTimer();
    }
  }, [tasksReady, tasks]);

  return null;
}
