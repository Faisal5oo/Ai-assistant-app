"use client";

import { create } from "zustand";
import { todayKey } from "@/lib/utils";
import { TECHNIQUE_DURATIONS_MS } from "@/lib/timerUtils";
import { getTasksFromCache } from "@/lib/query-cache";
import {
  updateTaskImperative,
  recordTaskTimeImperative,
  reorderTasksImperative,
  deleteTaskImperative,
  startPomodoroSessionImperative,
  endPomodoroSessionImperative,
  startDeepWorkSessionImperative,
  endDeepWorkSessionImperative,
  completeTaskImperative,
  allocateTimeBlockImperative,
  deallocateTimeBlockImperative,
} from "@/lib/imperative-mutations";
import { activateFocusTaskImperative } from "@/lib/activateFocusTaskImperative";
import {
  checkpointPausedSession,
  checkpointFocusSessionRemote,
  persistFocusSession,
  purgeFocusSession,
} from "@/lib/focusSessionSync";
import {
  clearActiveTimer,
  syncTimerForStatusChange,
} from "@/lib/taskStatusTimerSync";
import { toHighResAvatarUrl } from "@/lib/user-utils";

/**
 * @typedef {import('@/types/interfaces').ActiveTimer} ActiveTimer
 * @typedef {import('@/types/interfaces').ProductivityTechnique} ProductivityTechnique
 * @typedef {import('@/types/interfaces').ProductivityModal} ProductivityModal
 * @typedef {import('@/types/interfaces').TaskStatus} TaskStatus
 */

/** @returns {ActiveTimer} */
const initialTimer = () => ({
  taskId: null,
  isRunning: false,
  startedAt: 0,
  elapsedMs: 0,
  mode: "work",
  targetMs: undefined,
});

export const useTaskStore = create((set, get) => ({
  activeTimer: initialTimer(),
  userName: "",
  userAvatar: "",
  activeTechnique: null,
  pomodoroPhase: "work",
  pomodoroCount: 0,
  productivityModal: null,
  batchingFilterTag: null,
  deepWorkFocusMode: false,
  batchingFocusMode: false,
  flowFocusMode: false,
  pomodoroFocusMode: false,
  /** Hour block currently conducting visual takeover (no auto-timer). */
  runwayLiveHour: null,

  setRunwayLiveHour: (hour) => set({ runwayLiveHour: hour }),

  updateTask: (id, updates) => {
    updateTaskImperative(id, updates);
  },

  deleteTask: (id) => {
    if (get().activeTimer.taskId === id) {
      clearActiveTimer();
    }
    deleteTaskImperative(id);
  },

  moveTaskStatus: (id, status) => {
    const task = getTasksFromCache().find((t) => t.id === id);
    const previousStatus = task?.status;
    if (!previousStatus || previousStatus === status) return;

    updateTaskImperative(id, { status });
    syncTimerForStatusChange(id, previousStatus, status);
  },

  reorderTasks: (columnId, startIndex, endIndex) => {
    if (startIndex === endIndex) return;

    const tasks = getTasksFromCache();
    const column = tasks.filter((t) => t.status === columnId);
    if (
      startIndex < 0 ||
      endIndex < 0 ||
      startIndex >= column.length ||
      endIndex > column.length
    ) {
      return;
    }

    const nextColumn = [...column];
    const [moved] = nextColumn.splice(startIndex, 1);
    nextColumn.splice(endIndex, 0, moved);
    reorderTasksImperative({
      columnId,
      taskIds: nextColumn.map((t) => t.id),
    });
  },

  moveTaskToIndex: (id, status, index) => {
    const tasks = getTasksFromCache();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const without = tasks.filter((t) => t.id !== id);
    const column = without.filter((t) => t.status === status);
    const clamped = Math.max(0, Math.min(index, column.length));
    column.splice(clamped, 0, { ...task, status });

    reorderTasksImperative({
      columnId: status,
      taskIds: column.map((t) => t.id),
      ...(task.status !== status
        ? {
            sourceColumnId: task.status,
            sourceTaskIds: tasks
              .filter((t) => t.status === task.status && t.id !== id)
              .map((t) => t.id),
          }
        : {}),
    });
  },

  toggleTaskComplete: (id) => {
    const task = getTasksFromCache().find((t) => t.id === id);
    if (!task) return;

    if (task.status === "Completed") {
      get().moveTaskStatus(id, "Todo");
      return;
    }

    completeTaskImperative(id);
    syncTimerForStatusChange(id, task.status, "Completed");
  },

  startTimer: (taskId, options = {}) => {
    activateFocusTaskImperative(taskId, options);
  },

  pauseTimer: () => {
    const { activeTimer, activeTechnique } = get();
    if (!activeTimer.isRunning) return;
    const sessionMs = Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
    const nextTimer = {
      ...activeTimer,
      isRunning: false,
      elapsedMs: sessionMs,
      startedAt: 0,
    };
    set({ activeTimer: nextTimer });
    checkpointPausedSession(nextTimer, activeTechnique);
  },

  resumeTimer: () => {
    const { activeTimer, activeTechnique } = get();
    if (activeTimer.isRunning || !activeTimer.taskId) return;
    const nextTimer = {
      ...activeTimer,
      isRunning: true,
      startedAt: Date.now(),
    };
    set({ activeTimer: nextTimer });
    persistFocusSession(nextTimer, activeTechnique);
    checkpointFocusSessionRemote(nextTimer, activeTechnique);
  },

  stopTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer.taskId) {
      purgeFocusSession();
      set({ activeTimer: initialTimer(), activeTechnique: null });
      return;
    }

    let sessionMs = activeTimer.elapsedMs;
    if (activeTimer.isRunning && activeTimer.startedAt) {
      sessionMs = Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
    }

    const taskId = activeTimer.taskId;

    purgeFocusSession();
    set({ activeTimer: initialTimer(), activeTechnique: null });

    if (sessionMs > 0) {
      recordTaskTimeImperative(taskId, sessionMs, todayKey());
    }
  },

  tickTimer: () => {
    const { activeTimer } = get();
    if (!activeTimer.isRunning || !activeTimer.taskId) return;
    const currentMs =
      Date.now() - activeTimer.startedAt + activeTimer.elapsedMs;
    if (activeTimer.targetMs && currentMs >= activeTimer.targetMs) {
      get().onTimerComplete();
    }
  },

  onTimerComplete: () => {
    const { activeTechnique, pomodoroPhase, pomodoroCount } = get();
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

  setPomodoroFocusMode: (active) => set({ pomodoroFocusMode: active }),

  recordDeepWorkSession: (taskId, durationMs) => {
    if (!taskId || durationMs <= 0) return;

    const task = getTasksFromCache().find((t) => t.id === taskId);
    if (task?.status === "Todo") {
      get().moveTaskStatus(taskId, "In-Progress");
    }

    recordTaskTimeImperative(taskId, durationMs, todayKey());
  },

  recordPomodoroWorkComplete: (taskId, durationMinutes) => {
    const { pomodoroCount } = get();
    const minutes =
      durationMinutes ??
      Math.round((TECHNIQUE_DURATIONS_MS.pomodoro / 60_000) * 100) / 100;

    endPomodoroSessionImperative({
      taskId: taskId || null,
      type: "focus",
      duration: minutes,
      status: "completed",
    });

    set({
      pomodoroCount: pomodoroCount + 1,
      pomodoroPhase: "break",
    });
  },

  startPomodoroSession: (payload) => startPomodoroSessionImperative(payload),

  endPomodoroSession: (payload) => endPomodoroSessionImperative(payload),

  startDeepWorkSession: (payload) => startDeepWorkSessionImperative(payload),

  endDeepWorkSession: (payload) => endDeepWorkSessionImperative(payload),

  completeTask: (taskId) => completeTaskImperative(taskId),

  resolveDefaultTaskId: () => {
    const tasks = getTasksFromCache();
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
    allocateTimeBlockImperative(taskId, hour24);
  },

  unassignTimeBlock: (taskId, hour24) => {
    if (hour24 == null) {
      updateTaskImperative(taskId, {
        scheduledAt: null,
        timeBlockAllocations: [],
      });
      return;
    }
    deallocateTimeBlockImperative(taskId, hour24);
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

  setEisenhowerQuadrant: (taskId, quadrant) => {
    if (quadrant == null) {
      updateTaskImperative(taskId, { eisenhowerQuadrant: null });
      return;
    }
    get().updateTask(taskId, { eisenhowerQuadrant: quadrant });
  },

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
    const match = getTasksFromCache().find(
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

  setUserProfile: ({ name, avatar }) =>
    set({
      userName: name,
      userAvatar: toHighResAvatarUrl(avatar),
    }),

  clearUserProfile: () =>
    set({
      userName: "",
      userAvatar: "",
    }),
}));
