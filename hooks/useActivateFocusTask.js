"use client";

import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api-client";
import {
  buildHoistInProgressPayload,
  applyHoistInProgress,
  getInProgressTopTask,
} from "@/lib/focusQueue";
import { getRunwayPrimaryAllocation, buildRunwayFocusTimerOptions } from "@/lib/runway-focus";
import { getCurrentHour } from "@/lib/timeBlocking";
import { getTasksFromCache } from "@/lib/query-cache";
import { queryKeys } from "@/lib/query-keys";
import {
  captureTimerSnapshot,
  restoreTimerSnapshot,
  getSessionMs,
} from "@/lib/taskStatusTimerSync";
import { persistFocusSession } from "@/lib/focusSessionSync";
import { todayKey } from "@/lib/utils";
import { useTaskStore } from "@/store/useTaskStore";
import { appToast } from "@/lib/toast";

/**
 * @typedef {Object} ActivateFocusOptions
 * @property {import('@/types/interfaces').TimerMode} [mode]
 * @property {number} [targetMs]
 * @property {import('@/types/interfaces').ProductivityTechnique} [technique]
 */

export function useActivateFocusTask() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      taskId,
      previousTaskId,
      sessionMs,
      sessionInterval,
      reorder,
      timerOptions,
    }) => {
      if (previousTaskId && sessionMs > 0) {
        await tasksApi.recordTime(
          previousTaskId,
          sessionMs,
          todayKey(),
          sessionInterval ?? {}
        );
      }
      if (reorder) {
        await tasksApi.reorder(reorder);
      }
      return { taskId, timerOptions };
    },
    onMutate: async ({ taskId, previousTaskId, sessionMs, sessionInterval, reorder, timerOptions }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });

      const previousTasks = queryClient.getQueryData(queryKeys.tasks()) ?? [];
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard);
      const timerSnapshot = captureTimerSnapshot();

      let nextTasks = [...previousTasks];

      if (previousTaskId && sessionMs > 0) {
        nextTasks = nextTasks.map((t) =>
          t.id === previousTaskId
            ? { ...t, actualTimeSpent: t.actualTimeSpent + sessionMs }
            : t
        );
      }

      nextTasks = applyHoistInProgress(nextTasks, reorder);
      queryClient.setQueryData(queryKeys.tasks(), nextTasks);

      const nextTimer = {
        taskId,
        isRunning: true,
        startedAt: Date.now(),
        elapsedMs: 0,
        mode: timerOptions?.mode ?? "work",
        targetMs: timerOptions?.targetMs,
      };
      const nextTechnique = timerOptions?.technique ?? null;

      useTaskStore.setState({
        activeTimer: nextTimer,
        activeTechnique: nextTechnique,
      });
      persistFocusSession(nextTimer, nextTechnique);

      return { previousTasks, previousDashboard, timerSnapshot };
    },
    onError: (error, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      appToast.error(error, "Could not activate focus task. Changes were reverted.");
    },
  });

  const activate = useCallback(
    (taskId, timerOptions = {}) => {
      const tasks = getTasksFromCache();
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const { activeTimer } = useTaskStore.getState();

      if (activeTimer.taskId === taskId && activeTimer.isRunning) return;

      if (activeTimer.taskId === taskId && !activeTimer.isRunning) {
        useTaskStore.getState().resumeTimer();
        return;
      }

      const previousTaskId = activeTimer.taskId;
      const sessionMs = previousTaskId ? getSessionMs(activeTimer) : 0;
      const { reorder } = buildHoistInProgressPayload(tasks, taskId);

      // Build the real clock interval so the backend can write a precise timeLog entry
      const stoppedNow = new Date();
      const sessionInterval =
        previousTaskId && previousTaskId !== taskId && sessionMs > 0
          ? {
              startedAt: new Date(
                activeTimer.isRunning
                  ? activeTimer.startedAt
                  : stoppedNow.getTime() - sessionMs
              ).toISOString(),
              stoppedAt: stoppedNow.toISOString(),
            }
          : null;

      mutation.mutate({
        taskId,
        previousTaskId: previousTaskId && previousTaskId !== taskId ? previousTaskId : null,
        sessionMs: previousTaskId && previousTaskId !== taskId ? sessionMs : 0,
        sessionInterval,
        reorder,
        timerOptions,
      });
    },
    [mutation]
  );

  const playTopFocus = useCallback(() => {
    const tasks = getTasksFromCache();
    const runwayPrimary = getRunwayPrimaryAllocation(
      tasks,
      getCurrentHour(new Date())
    );

    if (runwayPrimary) {
      activate(
        runwayPrimary.task.id,
        buildRunwayFocusTimerOptions(runwayPrimary.durationMinutes)
      );
      return;
    }

    const top = getInProgressTopTask(tasks);
    if (top) {
      activate(top.id);
      return;
    }
    const fallback = tasks.find((t) => t.status === "Todo");
    if (fallback) activate(fallback.id);
  }, [activate]);

  return {
    activate,
    playTopFocus,
    isPending: mutation.isPending,
  };
}
