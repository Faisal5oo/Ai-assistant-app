"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POMODORO_SECONDS } from "@/lib/pomodoroConstants";

/**
 * @typedef {'work' | 'shortBreak' | 'longBreak'} PomodoroPhase
 */

/**
 * @param {Object} options
 * @param {(phase: PomodoroPhase) => void} [options.onSessionComplete]
 */
export function usePomodoroTimer({ onSessionComplete } = {}) {
  const [phase, setPhase] = useState(/** @type {PomodoroPhase} */ ("work"));
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_SECONDS.work);
  const [isRunning, setIsRunning] = useState(false);

  const phaseRef = useRef(/** @type {PomodoroPhase} */ ("work"));
  const secondsRef = useRef(POMODORO_SECONDS.work);
  const cycleRef = useRef(0);
  const onCompleteRef = useRef(onSessionComplete);
  const intervalRef = useRef(/** @type {ReturnType<typeof setInterval> | null} */ (null));

  useEffect(() => {
    onCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const syncDisplay = useCallback((p, seconds) => {
    phaseRef.current = p;
    secondsRef.current = seconds;
    setPhase(p);
    setSecondsLeft(seconds);
  }, []);

  const advancePhase = useCallback((notify = true) => {
    const finished = phaseRef.current;
    if (notify) onCompleteRef.current?.(finished);

    if (finished === "work") {
      cycleRef.current += 1;
      const nextPhase =
        cycleRef.current % 4 === 0 ? "longBreak" : "shortBreak";
      syncDisplay(nextPhase, POMODORO_SECONDS[nextPhase]);
      return;
    }

    syncDisplay("work", POMODORO_SECONDS.work);
  }, [syncDisplay]);

  useEffect(() => {
    if (!isRunning) {
      clearTick();
      return undefined;
    }

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

  const totalSeconds = POMODORO_SECONDS[phase];
  const progress =
    totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0;

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    clearTick();
    setIsRunning(false);
    cycleRef.current = 0;
    syncDisplay("work", POMODORO_SECONDS.work);
  }, [clearTick, syncDisplay]);

  const skip = useCallback(() => {
    clearTick();
    setIsRunning(false);
    advancePhase(false);
  }, [clearTick, advancePhase]);

  return {
    phase,
    secondsLeft,
    totalSeconds,
    progress,
    isRunning,
    workSessionsInCycle: cycleRef.current,
    start,
    pause,
    reset,
    skip,
  };
}
