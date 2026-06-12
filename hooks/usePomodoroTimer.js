"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POMODORO_SECONDS } from "@/lib/pomodoroConstants";

const STORAGE_KEY = "taskflow_pomodoro_state";

/** @returns {import('@/lib/pomodoroConstants').PersistedState | null} */
function loadState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.isRunning && parsed.savedAt) {
      const elapsed = Math.floor((Date.now() - parsed.savedAt) / 1000);
      const remaining = Math.max(0, (parsed.secondsLeft ?? 0) - elapsed);
      return { ...parsed, secondsLeft: remaining };
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, savedAt: Date.now() }));
  } catch {}
}

function clearState() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/**
 * @typedef {'work' | 'shortBreak' | 'longBreak'} PomodoroPhase
 *
 * @param {Object} options
 * @param {(phase: PomodoroPhase) => void} [options.onSessionComplete]
 * @param {number} [options.customWorkSeconds]  - custom work duration in seconds
 */
export function usePomodoroTimer({ onSessionComplete, customWorkSeconds } = {}) {
  const restored = useRef(loadState());

  // Build phase durations — custom work seconds override only the work phase
  const getDurations = useCallback(() => ({
    work: customWorkSeconds ?? POMODORO_SECONDS.work,
    shortBreak: POMODORO_SECONDS.shortBreak,
    longBreak: POMODORO_SECONDS.longBreak,
  }), [customWorkSeconds]);

  const [phase, setPhase] = useState(
    /** @type {PomodoroPhase} */ (restored.current?.phase ?? "work")
  );
  const [secondsLeft, setSecondsLeft] = useState(
    restored.current?.secondsLeft ?? (customWorkSeconds ?? POMODORO_SECONDS.work)
  );
  const [isRunning, setIsRunning] = useState(restored.current?.isRunning ?? false);

  const phaseRef = useRef(phase);
  const secondsRef = useRef(secondsLeft);
  const cycleRef = useRef(restored.current?.cycle ?? 0);
  const onCompleteRef = useRef(onSessionComplete);
  const intervalRef = useRef(/** @type {ReturnType<typeof setInterval>|null} */(null));

  useEffect(() => { onCompleteRef.current = onSessionComplete; }, [onSessionComplete]);

  // Persist on every meaningful state change
  useEffect(() => {
    saveState({ phase, secondsLeft, isRunning, cycle: cycleRef.current, savedAt: Date.now() });
  }, [phase, secondsLeft, isRunning]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const syncDisplay = useCallback((p, seconds) => {
    phaseRef.current = p;
    secondsRef.current = seconds;
    setPhase(p);
    setSecondsLeft(seconds);
  }, []);

  const advancePhase = useCallback((notify = true) => {
    const finished = phaseRef.current;
    const durations = getDurations();
    const finishedTotal = durations[finished];
    const finishedRemaining = secondsRef.current;

    if (notify) {
      onCompleteRef.current?.(finished, {
        totalSeconds: finishedTotal,
        secondsLeft: finishedRemaining,
      });
    }

    if (finished === "work") {
      cycleRef.current += 1;
      const nextPhase = cycleRef.current % 4 === 0 ? "longBreak" : "shortBreak";
      syncDisplay(nextPhase, getDurations()[nextPhase]);
      return;
    }
    syncDisplay("work", getDurations().work);
  }, [syncDisplay, getDurations]);

  useEffect(() => {
    if (!isRunning) { clearTick(); return undefined; }

    intervalRef.current = setInterval(() => {
      if (secondsRef.current <= 1) {
        clearTick();
        setIsRunning(false);
        advancePhase(true);
        return;
      }
      secondsRef.current -= 1;
      setSecondsLeft(secondsRef.current);
    }, 1000);

    return () => clearTick();
  }, [isRunning, advancePhase, clearTick]);

  const durations = getDurations();
  const totalSeconds = durations[phase];
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    clearTick();
    setIsRunning(false);
    cycleRef.current = 0;
    syncDisplay("work", getDurations().work);
    clearState();
  }, [clearTick, syncDisplay, getDurations]);

  const skip = useCallback(() => {
    clearTick();
    setIsRunning(false);
    advancePhase(false);
  }, [clearTick, advancePhase]);

  // When customWorkSeconds changes while idle on work phase, reset seconds
  useEffect(() => {
    if (!isRunning && phase === "work") {
      const newSecs = customWorkSeconds ?? POMODORO_SECONDS.work;
      secondsRef.current = newSecs;
      setSecondsLeft(newSecs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customWorkSeconds]);

  return { phase, secondsLeft, totalSeconds, progress, isRunning, workSessionsInCycle: cycleRef.current, start, pause, reset, skip };
}
