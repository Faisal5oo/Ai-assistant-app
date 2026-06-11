"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, dashboardApi } from "@/lib/api-client";
import { applyColumnReorder } from "@/lib/kanbanDragUtils";
import { queryKeys } from "@/lib/query-keys";
import {
  captureTimerSnapshot,
  restoreTimerSnapshot,
  diffAndSyncTimer,
  syncTimerForStatusChange,
} from "@/lib/taskStatusTimerSync";
import { appToast } from "@/lib/toast";

/** @param {Record<string, unknown>} updates */
function toApiTaskUpdates(updates) {
  /** @type {Record<string, unknown>} */
  const payload = { ...updates };

  if (payload.scheduledAt === undefined && "scheduledAt" in updates) {
    payload.scheduledAt = null;
  }

  return payload;
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => tasksApi.create(payload).then((r) => r.task),
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks, (prev) => [
        ...(prev ?? []),
        task,
      ]);
      appToast.success("Task created");
    },
    onError: (error) => {
      appToast.error(error, "Could not create task.");
    },
  });
}

export function useUpdateTaskMutation(options = {}) {
  const queryClient = useQueryClient();
  const { silent = false } = options;

  return useMutation({
    mutationFn: ({ id, updates }) =>
      tasksApi.update(id, toApiTaskUpdates(updates)).then((r) => r.task),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      const previous = queryClient.getQueryData(queryKeys.tasks) ?? [];
      const timerSnapshot = captureTimerSnapshot();
      const prevTask = previous.find((t) => t.id === id);

      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).map((t) => (t.id === id ? { ...t, ...updates } : t))
      );

      if (updates.status && prevTask) {
        syncTimerForStatusChange(id, prevTask.status, updates.status);
      }

      return { previous, timerSnapshot };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks, context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      if (!silent) {
        appToast.error(error, "Could not update task.");
      }
    },
    onSuccess: (task, variables) => {
      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).map((t) => (t.id === task.id ? task : t))
      );
      if (!silent && !variables.silent) {
        appToast.success("Task saved");
      }
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => tasksApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      const previous = queryClient.getQueryData(queryKeys.tasks);

      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).filter((t) => t.id !== id)
      );

      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks, context.previous);
      }
      appToast.error(error, "Could not delete task.");
    },
    onSuccess: () => {
      appToast.success("Task deleted");
    },
  });
}

export function useToggleTaskCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nextStatus }) => {
      const { task: updated } = await tasksApi.update(id, { status: nextStatus });
      return updated;
    },
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      const previous = queryClient.getQueryData(queryKeys.tasks) ?? [];
      const timerSnapshot = captureTimerSnapshot();
      const prevTask = previous.find((t) => t.id === id);

      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );

      if (prevTask) {
        syncTimerForStatusChange(id, prevTask.status, nextStatus);
      }

      return { previous, timerSnapshot };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks, context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      appToast.error(error, "Could not update task.");
    },
    onSuccess: (task) => {
      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).map((t) => (t.id === task.id ? task : t))
      );
    },
  });
}

export function useReorderTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ columnId, taskIds, sourceColumnId, sourceTaskIds }) =>
      tasksApi.reorder({ columnId, taskIds, sourceColumnId, sourceTaskIds }),
    onMutate: async ({ columnId, taskIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      const previous = queryClient.getQueryData(queryKeys.tasks) ?? [];
      const timerSnapshot = captureTimerSnapshot();
      const next = applyColumnReorder(previous, columnId, taskIds);

      queryClient.setQueryData(queryKeys.tasks, next);
      diffAndSyncTimer(previous, next);

      return { previous, timerSnapshot };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks, context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      appToast.error(error, "Could not reorder tasks. Changes were reverted.");
    },
  });
}

export function useRecordTaskTimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, durationMs, date }) =>
      tasksApi.recordTime(id, durationMs, date),
    onMutate: async ({ id, durationMs, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });

      const previousTasks = queryClient.getQueryData(queryKeys.tasks);
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard);

      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).map((t) =>
          t.id === id
            ? { ...t, actualTimeSpent: t.actualTimeSpent + durationMs }
            : t
        )
      );

      queryClient.setQueryData(queryKeys.dashboard, (prev) => {
        const logs = prev?.dailyLogs ?? [];
        const existing = logs.find((l) => l.date === date);
        const dailyLogs = existing
          ? logs.map((l) =>
              l.date === date ? { ...l, totalMs: l.totalMs + durationMs } : l
            )
          : [...logs, { date, totalMs: durationMs }];

        return { ...prev, dailyLogs };
      });

      return { previousTasks, previousDashboard };
    },
    onError: (error, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKeys.tasks, context.previousTasks);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
      appToast.error(error, "Could not record time.");
    },
    onSuccess: ({ task, dailyLogs }) => {
      queryClient.setQueryData(queryKeys.tasks, (prev) =>
        (prev ?? []).map((t) => (t.id === task.id ? task : t))
      );
      queryClient.setQueryData(queryKeys.dashboard, (prev) => ({
        ...prev,
        dailyLogs,
      }));
    },
  });
}

export function usePomodoroIncrementMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      dashboardApi
        .update({ pomodoroIncrement: payload })
        .then((r) => r.dashboard),
    onMutate: async ({ date, goal }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });
      const previous = queryClient.getQueryData(queryKeys.dashboard);
      const current = previous?.pomodoroDaily ?? {
        date,
        completed: 0,
        goal: goal ?? 4,
      };

      const pomodoroDaily =
        current.date !== date
          ? { date, completed: 1, goal: goal ?? current.goal ?? 4 }
          : { ...current, completed: current.completed + 1 };

      queryClient.setQueryData(queryKeys.dashboard, (prev) => ({
        ...prev,
        pomodoroDaily,
      }));

      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.dashboard, context.previous);
      }
      appToast.error(error, "Could not update pomodoro progress.");
    },
    onSuccess: (dashboard) => {
      queryClient.setQueryData(queryKeys.dashboard, dashboard);
    },
  });
}
