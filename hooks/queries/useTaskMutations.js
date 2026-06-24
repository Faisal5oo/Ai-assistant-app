"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, dashboardApi } from "@/lib/api-client";
import { applyColumnReorder } from "@/lib/kanbanDragUtils";
import { queryKeys } from "@/lib/query-keys";
import { patchDashboardCache } from "@/lib/query-cache";
import {
  captureTimerSnapshot,
  restoreTimerSnapshot,
  clearActiveTimer,
  diffAndSyncTimer,
  syncTimerForStatusChange,
} from "@/lib/taskStatusTimerSync";
import { useTaskStore } from "@/store/useTaskStore";
import { appToast } from "@/lib/toast";
import {
  optimisticCompletionTimeMs,
  patchDashboardForCompletionCredit,
  syncCompletionTimeCaches,
  syncBulkCompletionTimeCaches,
} from "@/lib/completion-cache-sync";

/** @param {import('@tanstack/react-query').QueryClient} queryClient */
function invalidateArchivedTasks(queryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tasks("archived") });
}

/** @param {Record<string, unknown>} updates */
function toApiTaskUpdates(updates) {
  /** @type {Record<string, unknown>} */
  const payload = { ...updates };

  if (payload.scheduledAt === undefined && "scheduledAt" in updates) {
    payload.scheduledAt = null;
  }

  return payload;
}

/** @param {import('@/types/interfaces').Task | undefined} task @param {Record<string, unknown>} updates */
function applyOptimisticCompletionUpdates(task, updates) {
  if (!task) return updates;

  const nextStatus = updates.status;
  if (typeof nextStatus !== "string") return updates;

  const creditMs = optimisticCompletionTimeMs(task, nextStatus);
  if (creditMs <= 0) return updates;

  return {
    ...updates,
    actualTimeSpent: (task.actualTimeSpent ?? 0) + creditMs,
  };
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => tasksApi.create(payload).then((r) => r.task),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previous = queryClient.getQueryData(queryKeys.tasks()) ?? [];

      // Use crypto.randomUUID() with a structured prefix so React key and
      // Framer Motion layoutId reconciliation never collides with real MongoDB ids.
      const tempId = `temp-${crypto.randomUUID()}`;

      /** @type {import('@/types/interfaces').Task} */
      const optimistic = {
        id: tempId,
        title: payload.title,
        category: payload.category ?? "Work",
        priority: payload.priority ?? "Medium",
        // The API always creates tasks as "Todo"; mirror that here explicitly
        // so the card lands in the correct Kanban column from the first render.
        status: "Todo",
        estimatedTime: payload.estimatedTime ?? 30,
        actualTimeSpent: 0,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        scheduledAt: payload.scheduledAt ?? null,
        description: payload.description ?? null,
        // sortOrder must be present so KanbanColumn's useMemo sort does not
        // reorder the list when the server response arrives with a real value.
        sortOrder: (previous.at(-1)?.sortOrder ?? -1) + 1,
        completedPomodoros: 0,
        batchCategory: payload.batchCategory ?? null,
        timeBlockAllocations: [],
        lastWorkedAt: null,
        eisenhowerQuadrant: payload.eisenhowerQuadrant ?? null,
        delegateTo: null,
        automateCandidate: false,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKeys.tasks(), [...previous, optimistic]);
      return { previous, tempId };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks(), context.previous);
      }
      appToast.error(error, "Could not create task.");
    },
    onSuccess: (task, _vars, context) => {
      // Strictly replace the temp placeholder using its id so we never
      // accidentally append a duplicate when a background refetch races
      // with this synchronous cache write.
      queryClient.setQueryData(queryKeys.tasks(), (prev) => {
        const list = prev ?? [];
        const tempIdx = list.findIndex((t) => t.id === context?.tempId);
        if (tempIdx !== -1) {
          const next = [...list];
          next[tempIdx] = task;
          return next;
        }
        // Fallback: temp entry was already evicted — append only if not present.
        const alreadyPresent = list.some((t) => t.id === task.id);
        return alreadyPresent ? list : [...list, task];
      });
      appToast.success("Task created");
    },
  });
}

export function useUpdateTaskMutation(options = {}) {
  const queryClient = useQueryClient();
  const { silent = false } = options;

  return useMutation({
    mutationFn: ({ id, updates }) =>
      tasksApi.update(id, toApiTaskUpdates(updates)).then((r) => r),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previous = queryClient.getQueryData(queryKeys.tasks()) ?? [];
      const timerSnapshot = captureTimerSnapshot();
      const prevTask = previous.find((t) => t.id === id);
      const optimisticUpdates = applyOptimisticCompletionUpdates(prevTask, updates);

      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
        (prev ?? []).map((t) => (t.id === id ? { ...t, ...optimisticUpdates } : t))
      );

      const creditMs = optimisticCompletionTimeMs(prevTask, updates.status);
      if (creditMs > 0) {
        patchDashboardForCompletionCredit(creditMs);
      }

      if (updates.status && prevTask) {
        syncTimerForStatusChange(id, prevTask.status, updates.status);
      }

      return { previous, timerSnapshot, prevTask };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks(), context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      if (!silent) {
        appToast.error(error, "Could not update task.");
      }
    },
    onSuccess: ({ task, dailyLogs }, variables, context) => {
      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
        (prev ?? []).map((t) => (t.id === task.id ? task : t))
      );
      syncCompletionTimeCaches(context?.prevTask, task, dailyLogs, {
        optimisticDashboardAlreadyPatched: true,
      });
      if (variables?.updates?.status) {
        invalidateArchivedTasks(queryClient);
      }
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
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previous = queryClient.getQueryData(queryKeys.tasks()) ?? [];
      const timerSnapshot = captureTimerSnapshot();

      if (useTaskStore.getState().activeTimer.taskId === id) {
        clearActiveTimer();
      }

      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
        (prev ?? []).filter((t) => t.id !== id)
      );
      queryClient.setQueryData(queryKeys.tasks("archived"), (prev) =>
        prev ? (prev ?? []).filter((t) => t.id !== id) : prev
      );

      return { previous, timerSnapshot };
    },
    onError: (error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks(), context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      appToast.error(error, "Could not delete task. Changes were reverted.");
    },
    onSuccess: () => {
      invalidateArchivedTasks(queryClient);
      appToast.success("Task deleted");
    },
  });
}

export function useToggleTaskCompleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nextStatus }) => {
      const { task: updated, dailyLogs } = await tasksApi.update(id, {
        status: nextStatus,
      });
      return { task: updated, dailyLogs };
    },
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previous = queryClient.getQueryData(queryKeys.tasks()) ?? [];
      const timerSnapshot = captureTimerSnapshot();
      const prevTask = previous.find((t) => t.id === id);
      const creditMs = optimisticCompletionTimeMs(prevTask, nextStatus);

      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
        (prev ?? []).map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            status: nextStatus,
            ...(creditMs > 0 ? { actualTimeSpent: (t.actualTimeSpent ?? 0) + creditMs } : {}),
          };
        })
      );

      if (creditMs > 0) {
        patchDashboardForCompletionCredit(creditMs);
      }

      if (prevTask) {
        syncTimerForStatusChange(id, prevTask.status, nextStatus);
      }

      return { previous, timerSnapshot, prevTask };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks(), context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      appToast.error(error, "Could not update task.");
    },
    onSuccess: ({ task, dailyLogs }, _vars, context) => {
      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
        (prev ?? []).map((t) => (t.id === task.id ? task : t))
      );
      syncCompletionTimeCaches(context?.prevTask, task, dailyLogs, {
        optimisticDashboardAlreadyPatched: true,
      });
      invalidateArchivedTasks(queryClient);
    },
  });
}

export function useReorderTasksMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ columnId, taskIds, sourceColumnId, sourceTaskIds }) =>
      tasksApi.reorder({ columnId, taskIds, sourceColumnId, sourceTaskIds }),
    onMutate: async ({ columnId, taskIds }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      const previous = queryClient.getQueryData(queryKeys.tasks()) ?? [];
      const timerSnapshot = captureTimerSnapshot();
      const reordered = applyColumnReorder(previous, columnId, taskIds);
      const next = reordered.map((task) => {
        const prevTask = previous.find((t) => t.id === task.id);
        const creditMs = optimisticCompletionTimeMs(prevTask, task.status);
        if (creditMs <= 0) return task;
        return {
          ...task,
          actualTimeSpent: (task.actualTimeSpent ?? 0) + creditMs,
        };
      });

      queryClient.setQueryData(queryKeys.tasks(), next);
      syncBulkCompletionTimeCaches(previous, next);
      diffAndSyncTimer(previous, next);

      return { previous, timerSnapshot };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks(), context.previous);
      }
      restoreTimerSnapshot(context?.timerSnapshot);
      appToast.error(error, "Could not reorder tasks. Changes were reverted.");
    },
    onSuccess: ({ dailyLogs }, variables) => {
      if (dailyLogs) {
        patchDashboardCache({ dailyLogs });
      }
      if (variables?.columnId === "Completed" || variables?.sourceColumnId === "Completed") {
        invalidateArchivedTasks(queryClient);
      }
    },
  });
}

export function useRecordTaskTimeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, durationMs, date, interval }) =>
      tasksApi.recordTime(id, durationMs, date, interval ?? {}),
    onMutate: async ({ id, durationMs, date }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks() });
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard });

      const previousTasks = queryClient.getQueryData(queryKeys.tasks());
      const previousDashboard = queryClient.getQueryData(queryKeys.dashboard);

      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
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
        queryClient.setQueryData(queryKeys.tasks(), context.previousTasks);
      }
      if (context?.previousDashboard) {
        queryClient.setQueryData(queryKeys.dashboard, context.previousDashboard);
      }
      appToast.error(error, "Could not record time.");
    },
    onSuccess: ({ task, dailyLogs }) => {
      queryClient.setQueryData(queryKeys.tasks(), (prev) =>
        (prev ?? []).map((t) => (t.id === task.id ? task : t))
      );
      queryClient.setQueryData(queryKeys.dashboard, (prev) => ({
        ...prev,
        dailyLogs,
      }));
      // Invalidate analytics so the next visit to /analytics fetches fresh aggregations
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
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
