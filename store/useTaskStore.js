"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, parseISO } from "date-fns";
import { createSeedTasks, createSeedDailyLogs } from "@/lib/seedData";
import { buildSlotIsoForToday } from "@/lib/timeBlocking";
import { todayKey, isScheduledToday } from "@/lib/utils";
import { TECHNIQUE_DURATIONS_MS } from "@/lib/timerUtils";

/**
 * @typedef {import('@/types/interfaces').Task} Task
 * @typedef {import('@/types/interfaces').ActiveTimer} ActiveTimer
 * @typedef {import('@/types/interfaces').DailyTimeLog} DailyTimeLog
 * @typedef {import('@/types/interfaces').ProductivityTechnique} ProductivityTechnique
 * @typedef {import('@/types/interfaces').ProductivityModal} ProductivityModal
 * @typedef {import('@/types/interfaces').EisenhowerQuadrant} EisenhowerQuadrant
 */

/** @param {DailyTimeLog[]} logs @param {string} date @param {number} ms */
function addToDailyLog(logs, date, ms) {
  const existing = logs.find((l) => l.date === date);
  if (existing) {
    return logs.map((l) =>
      l.date === date ? { ...l, totalMs: l.totalMs + ms } : l
    );
  }
  return [...logs, { date, totalMs: ms }];
}

/**
 * @param {Task[]} tasks
 * @param {string} id
 * @param {number} ms
 */
function addTimeToTask(tasks, id, ms) {
  return tasks.map((t) =>
    t.id === id ? { ...t, actualTimeSpent: t.actualTimeSpent + ms } : t
  );
}

/** @returns {ActiveTimer} */
const initialTimer = () => ({
  taskId: null,
  isRunning: false,
  startedAt: 0,
  elapsedMs: 0,
  mode: "work",
  targetMs: undefined,
});

export const useTaskStore = create(
  persist(
    (set, get) => ({
      tasks: createSeedTasks(),
      dailyLogs: createSeedDailyLogs(),
      activeTimer: initialTimer(),
      userName: "Nixtio",
      activeTechnique: null,
      pomodoroPhase: "work",
      pomodoroCount: 0,
      pomodoroDaily: { date: todayKey(), completed: 0, goal: 4 },
      productivityModal: null,
      batchingFilterTag: null,
      deepWorkFocusMode: false,
      batchingFocusMode: false,
      flowFocusMode: false,

      addTask: (taskData) => {
        const id = crypto.randomUUID();
        /** @type {Task} */
        const task = {
          id,
          title: taskData.title,
          category: taskData.category,
          priority: taskData.priority,
          status: "Todo",
          estimatedTime: taskData.estimatedTime ?? 30,
          actualTimeSpent: 0,
          tags: taskData.tags ?? [],
          scheduledAt: taskData.scheduledAt,
          description: taskData.description,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        return id;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTask: (id) => {
        const { activeTimer } = get();
        if (activeTimer.taskId === id) {
          get().stopTimer();
        }
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      moveTaskStatus: (id, status) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        }));
      },

      /**
       * Reorder tasks within a single Kanban column (status).
       * @param {import('@/types/interfaces').TaskStatus} columnId
       * @param {number} startIndex
       * @param {number} endIndex
       */
      reorderTasks: (columnId, startIndex, endIndex) => {
        if (startIndex === endIndex) return;
        set((s) => {
          const column = s.tasks.filter((t) => t.status === columnId);
          if (
            startIndex < 0 ||
            endIndex < 0 ||
            startIndex >= column.length ||
            endIndex > column.length
          ) {
            return s;
          }
          const nextColumn = [...column];
          const [moved] = nextColumn.splice(startIndex, 1);
          nextColumn.splice(endIndex, 0, moved);
          const order = ["Todo", "In-Progress", "Completed"];
          return {
            tasks: order.flatMap((st) =>
              st === columnId
                ? nextColumn
                : s.tasks.filter((t) => t.status === st)
            ),
          };
        });
      },

      /**
       * Move a task to another column at a specific index.
       * @param {string} id
       * @param {import('@/types/interfaces').TaskStatus} status
       * @param {number} index
       */
      moveTaskToIndex: (id, status, index) => {
        set((s) => {
          const task = s.tasks.find((t) => t.id === id);
          if (!task) return s;
          const without = s.tasks.filter((t) => t.id !== id);
          const column = without.filter((t) => t.status === status);
          const clamped = Math.max(0, Math.min(index, column.length));
          column.splice(clamped, 0, { ...task, status });
          const order = ["Todo", "In-Progress", "Completed"];
          return {
            tasks: order.flatMap((st) =>
              st === status ? column : without.filter((t) => t.status === st)
            ),
          };
        });
      },

      toggleTaskComplete: (id) => {
        const task = get().tasks.find((t) => t.id === id);
        if (!task) return;
        const next =
          task.status === "Completed" ? "Todo" : "Completed";
        get().moveTaskStatus(id, next);
      },

      startTimer: (taskId, options = {}) => {
        const { tasks, activeTimer } = get();
        if (activeTimer.isRunning && activeTimer.taskId) {
          get().pauseTimer();
        }
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return;
        if (task.status === "Todo") {
          get().moveTaskStatus(taskId, "In-Progress");
        }
        set({
          activeTimer: {
            taskId,
            isRunning: true,
            startedAt: Date.now(),
            elapsedMs: 0,
            mode: options.mode ?? "work",
            targetMs: options.targetMs,
          },
          activeTechnique: options.technique ?? null,
        });
      },

      pauseTimer: () => {
        const { activeTimer } = get();
        if (!activeTimer.isRunning) return;
        const sessionMs = Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
        set({
          activeTimer: {
            ...activeTimer,
            isRunning: false,
            elapsedMs: sessionMs,
            startedAt: 0,
          },
        });
      },

      resumeTimer: () => {
        const { activeTimer } = get();
        if (activeTimer.isRunning || !activeTimer.taskId) return;
        set({
          activeTimer: {
            ...activeTimer,
            isRunning: true,
            startedAt: Date.now(),
          },
        });
      },

      stopTimer: () => {
        const { activeTimer, tasks, dailyLogs } = get();
        if (!activeTimer.taskId) {
          set({ activeTimer: initialTimer(), activeTechnique: null });
          return;
        }
        let sessionMs = activeTimer.elapsedMs;
        if (activeTimer.isRunning && activeTimer.startedAt) {
          sessionMs = Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
        }
        if (sessionMs > 0) {
          const date = todayKey();
          set({
            tasks: addTimeToTask(tasks, activeTimer.taskId, sessionMs),
            dailyLogs: addToDailyLog(dailyLogs, date, sessionMs),
          });
        }
        set({ activeTimer: initialTimer(), activeTechnique: null });
      },

      tickTimer: () => {
        const { activeTimer } = get();
        if (!activeTimer.isRunning || !activeTimer.taskId) return;
        const currentMs =
          Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
        if (
          activeTimer.targetMs &&
          currentMs >= activeTimer.targetMs
        ) {
          get().onTimerComplete();
        }
      },

      onTimerComplete: () => {
        const { activeTimer, activeTechnique, pomodoroPhase, pomodoroCount } = get();
        get().stopTimer();
        if (activeTechnique === "pomodoro") {
          if (pomodoroPhase === "work") {
            set({
              pomodoroPhase: "break",
              pomodoroCount: pomodoroCount + 1,
            });
          } else {
            set({ pomodoroPhase: "work" });
          }
        }
      },

      getTimerDisplayMs: () => {
        const { activeTimer } = get();
        if (!activeTimer.taskId) return 0;
        if (activeTimer.isRunning && activeTimer.startedAt) {
          return Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
        }
        return activeTimer.elapsedMs;
      },

      setProductivityModal: (modal) => set({ productivityModal: modal }),

      setBatchingFilterTag: (tag) => set({ batchingFilterTag: tag }),

      setDeepWorkFocusMode: (active) => set({ deepWorkFocusMode: active }),

      setBatchingFocusMode: (active) => set({ batchingFocusMode: active }),

      setFlowFocusMode: (active) => set({ flowFocusMode: active }),

      recordDeepWorkSession: (taskId, durationMs) => {
        if (!taskId || durationMs <= 0) return;
        const { tasks, dailyLogs } = get();
        const date = todayKey();
        const task = tasks.find((t) => t.id === taskId);
        if (task?.status === "Todo") {
          get().moveTaskStatus(taskId, "In-Progress");
        }
        set({
          tasks: addTimeToTask(tasks, taskId, durationMs),
          dailyLogs: addToDailyLog(dailyLogs, date, durationMs),
        });
      },

      recordPomodoroWorkComplete: (taskId) => {
        const date = todayKey();
        const durationMs = TECHNIQUE_DURATIONS_MS.pomodoro;
        let { pomodoroDaily, tasks, dailyLogs, pomodoroCount } = get();

        if (pomodoroDaily.date !== date) {
          pomodoroDaily = { date, completed: 0, goal: pomodoroDaily.goal ?? 4 };
        }

        if (taskId) {
          tasks = addTimeToTask(tasks, taskId, durationMs);
          dailyLogs = addToDailyLog(dailyLogs, date, durationMs);
          set({ tasks, dailyLogs });
        }

        set({
          pomodoroCount: pomodoroCount + 1,
          pomodoroPhase: "break",
          pomodoroDaily: {
            ...pomodoroDaily,
            completed: pomodoroDaily.completed + 1,
          },
        });
      },

      resolveDefaultTaskId: () => {
        const { tasks } = get();
        return (
          tasks.find((t) => t.status === "In-Progress")?.id ??
          tasks.find((t) => t.status === "Todo")?.id ??
          null
        );
      },

      scheduleTaskBlock: (taskId, scheduledAtIso) => {
        get().updateTask(taskId, { scheduledAt: scheduledAtIso });
      },

      assignTimeBlock: (taskId, hour24) => {
        const slotIso = buildSlotIsoForToday(hour24);
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id === taskId) {
              return { ...t, scheduledAt: slotIso };
            }
            if (
              t.scheduledAt &&
              isScheduledToday(t.scheduledAt) &&
              parseISO(t.scheduledAt).getHours() === hour24
            ) {
              const next = { ...t };
              delete next.scheduledAt;
              return next;
            }
            return t;
          }),
        }));
      },

      unassignTimeBlock: (taskId) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const next = { ...t };
            delete next.scheduledAt;
            return next;
          }),
        }));
      },

      startTechniqueTimer: (technique, taskId) => {
        const targetId = taskId ?? get().resolveDefaultTaskId();
        if (!targetId) return false;

        /** @type {{ mode: ActiveTimer['mode'], targetMs?: number, technique: ProductivityTechnique }} */
        const options = { mode: "work", technique };

        switch (technique) {
          case "pomodoro":
            options.mode = "pomodoro";
            options.targetMs = TECHNIQUE_DURATIONS_MS.pomodoro;
            set({ pomodoroPhase: "work" });
            break;
          case "deep-work":
            options.mode = "deep-work";
            options.targetMs = TECHNIQUE_DURATIONS_MS["deep-work"];
            break;
          case "flow":
            options.mode = "flow";
            options.targetMs = TECHNIQUE_DURATIONS_MS.flow;
            break;
          default:
            return false;
        }

        get().startTimer(targetId, options);
        return targetId;
      },

      applyTechnique: (technique, taskId) => {
        if (technique === "time-blocking") {
          set({ productivityModal: "time-blocking", activeTechnique: technique });
          return "modal";
        }
        if (technique === "batching") {
          set({ productivityModal: "batching", activeTechnique: technique });
          return "modal";
        }
        if (technique === "eisenhower") {
          set({ productivityModal: "eisenhower", activeTechnique: technique });
          return "modal";
        }
        if (technique === "pomodoro" || technique === "deep-work" || technique === "flow") {
          const id = get().startTechniqueTimer(technique, taskId);
          return id ?? false;
        }
        return false;
      },

      startEisenhowerTask: (taskId) => {
        get().setProductivityModal(null);
        return get().startTimer(taskId, {
          mode: "work",
          technique: "eisenhower",
        });
      },

      /**
       * @param {string} taskId
       * @param {import('@/types/interfaces').EisenhowerQuadrant | null} quadrant - null clears allocation (inbox)
       */
      setEisenhowerQuadrant: (taskId, quadrant) => {
        set((s) => ({
          tasks: s.tasks.map((t) => {
            if (t.id !== taskId) return t;
            if (quadrant == null) {
              const next = { ...t };
              delete next.eisenhowerQuadrant;
              return next;
            }
            return { ...t, eisenhowerQuadrant: quadrant };
          }),
        }));
      },

      /**
       * @param {string} taskId
       * @param {{ delegateTo?: string; automateCandidate?: boolean }} meta
       */
      updateEisenhowerMeta: (taskId, meta) => {
        get().updateTask(taskId, meta);
      },

      confirmTimeBlock: (taskId, scheduledAtIso, startFocus) => {
        get().scheduleTaskBlock(taskId, scheduledAtIso);
        get().setProductivityModal(null);
        if (startFocus) {
          get().startTimer(taskId, {
            mode: "work",
            technique: "time-blocking",
            targetMs: 60 * 60 * 1000,
          });
        } else {
          set({ activeTechnique: "time-blocking" });
        }
        return taskId;
      },

      startBatchSession: (tag) => {
        const { tasks } = get();
        const match = tasks.find(
          (t) =>
            t.status !== "Completed" &&
            t.tags.some((tg) => tg.toLowerCase() === tag.toLowerCase())
        );
        if (!match) return false;
        set({ batchingFilterTag: tag, productivityModal: null });
        get().startTimer(match.id, {
          mode: "work",
          technique: "batching",
          targetMs: 30 * 60 * 1000,
        });
        return match.id;
      },

      setUserName: (name) => set({ userName: name }),
    }),
    {
      name: "taskflow-storage",
      partialize: (state) => ({
        tasks: state.tasks,
        dailyLogs: state.dailyLogs,
        userName: state.userName,
        pomodoroDaily: state.pomodoroDaily,
      }),
    }
  )
);
