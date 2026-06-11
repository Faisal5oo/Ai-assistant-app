import { tasksApi } from "@/lib/api-client";
import {
  buildHoistInProgressPayload,
  applyHoistInProgress,
} from "@/lib/focusQueue";
import { getTasksFromCache, setTasksInCache } from "@/lib/query-cache";
import { getSessionMs } from "@/lib/taskStatusTimerSync";
import { todayKey } from "@/lib/utils";
import { useTaskStore } from "@/store/useTaskStore";
import { appToast } from "@/lib/toast";

/**
 * Imperative activate — used by productivity store flows outside React hooks.
 * @param {string} taskId
 * @param {import('@/hooks/useActivateFocusTask').ActivateFocusOptions} [timerOptions]
 */
export async function activateFocusTaskImperative(taskId, timerOptions = {}) {
  const tasks = getTasksFromCache();
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return false;

  const { activeTimer } = useTaskStore.getState();

  if (activeTimer.taskId === taskId && activeTimer.isRunning) return true;
  if (activeTimer.taskId === taskId && !activeTimer.isRunning) {
    useTaskStore.getState().resumeTimer();
    return true;
  }

  const previousTasks = tasks;
  const previousTaskId =
    activeTimer.taskId && activeTimer.taskId !== taskId
      ? activeTimer.taskId
      : null;
  const sessionMs = previousTaskId ? getSessionMs(activeTimer) : 0;
  const { reorder } = buildHoistInProgressPayload(tasks, taskId);

  let nextTasks = [...previousTasks];
  if (previousTaskId && sessionMs > 0) {
    nextTasks = nextTasks.map((t) =>
      t.id === previousTaskId
        ? { ...t, actualTimeSpent: t.actualTimeSpent + sessionMs }
        : t
    );
  }
  nextTasks = applyHoistInProgress(nextTasks, reorder);
  setTasksInCache(nextTasks);

  useTaskStore.setState({
    activeTimer: {
      taskId,
      isRunning: true,
      startedAt: Date.now(),
      elapsedMs: 0,
      mode: timerOptions.mode ?? "work",
      targetMs: timerOptions.targetMs,
    },
    activeTechnique: timerOptions.technique ?? null,
  });

  try {
    if (previousTaskId && sessionMs > 0) {
      await tasksApi.recordTime(previousTaskId, sessionMs, todayKey());
    }
    if (reorder) {
      await tasksApi.reorder(reorder);
    }
    return true;
  } catch (error) {
    setTasksInCache(previousTasks);
    useTaskStore.setState({
      activeTimer: { ...activeTimer },
    });
    appToast.error(error, "Could not activate focus task.");
    return false;
  }
}
