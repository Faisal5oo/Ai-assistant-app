"use client";

import { useCallback, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";

/** @typedef {import('@/lib/deepWorkConstants').DeepWorkPhase} DeepWorkPhase */

/**
 * @typedef {Object} DeepWorkSession
 * @property {string} taskId
 * @property {string} taskTitle
 * @property {string} objective
 * @property {number} durationMinutes
 * @property {number} startedAt
 */

export function useDeepWorkSession() {
  const [phase, setPhase] = useState(/** @type {DeepWorkPhase} */ ("setup"));
  const [session, setSession] = useState(/** @type {DeepWorkSession | null} */ (null));
  const [distractions, setDistractions] = useState(/** @type {string[]} */ ([]));
  const [showAbandonPrompt, setShowAbandonPrompt] = useState(false);

  const setDeepWorkFocusMode = useTaskStore((s) => s.setDeepWorkFocusMode);
  const recordDeepWorkSession = useTaskStore((s) => s.recordDeepWorkSession);
  const moveTaskStatus = useTaskStore((s) => s.moveTaskStatus);

  const commitSession = useCallback(
    (config) => {
      const { taskId, taskTitle, objective, durationMinutes } = config;
      if (!taskId || !objective.trim()) return false;

      moveTaskStatus(taskId, "In-Progress");
      setSession({
        taskId,
        taskTitle,
        objective: objective.trim(),
        durationMinutes,
        startedAt: Date.now(),
      });
      setDistractions([]);
      setPhase("active");
      setDeepWorkFocusMode(true);
      return true;
    },
    [moveTaskStatus, setDeepWorkFocusMode]
  );

  const completeSession = useCallback(() => {
    setDeepWorkFocusMode(false);
    setPhase("complete");
    setShowAbandonPrompt(false);
  }, [setDeepWorkFocusMode]);

  const requestAbandon = useCallback(() => {
    setShowAbandonPrompt(true);
  }, []);

  const cancelAbandon = useCallback(() => {
    setShowAbandonPrompt(false);
  }, []);

  const confirmAbandon = useCallback(() => {
    setDeepWorkFocusMode(false);
    setSession(null);
    setDistractions([]);
    setShowAbandonPrompt(false);
    setPhase("setup");
  }, [setDeepWorkFocusMode]);

  const logSessionToStore = useCallback(() => {
    if (!session) return;
    const durationMs = session.durationMinutes * 60 * 1000;
    recordDeepWorkSession(session.taskId, durationMs);
    setSession(null);
    setDistractions([]);
    setPhase("setup");
  }, [session, recordDeepWorkSession]);

  const addDistraction = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setDistractions((prev) => [...prev, trimmed]);
  }, []);

  const resetToSetup = useCallback(() => {
    setDeepWorkFocusMode(false);
    setSession(null);
    setDistractions([]);
    setShowAbandonPrompt(false);
    setPhase("setup");
  }, [setDeepWorkFocusMode]);

  return {
    phase,
    session,
    distractions,
    showAbandonPrompt,
    commitSession,
    completeSession,
    requestAbandon,
    cancelAbandon,
    confirmAbandon,
    logSessionToStore,
    addDistraction,
    resetToSetup,
  };
}
