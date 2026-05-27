"use client";

import { useCallback, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { FLOW_DEFAULT_MINUTES } from "@/lib/flowConstants";

/**
 * @typedef {Object} FlowSession
 * @property {string} primaryTaskId
 * @property {string[]} targetTaskIds
 * @property {string} primaryTaskTitle
 * @property {number} durationMinutes
 * @property {number} startedAt
 */

export function useFlowSession() {
  const [phase, setPhase] = useState(
    /** @type {import('@/lib/flowConstants').FlowPhase} */ ("setup")
  );
  const [session, setSession] = useState(
    /** @type {FlowSession | null} */ (null)
  );
  const [parkedThoughts, setParkedThoughts] = useState(
    /** @type {{ id: string; text: string; createdAt: number }[]} */ ([])
  );

  const setFlowFocusMode = useTaskStore((s) => s.setFlowFocusMode);
  const recordDeepWorkSession = useTaskStore((s) => s.recordDeepWorkSession);
  const moveTaskStatus = useTaskStore((s) => s.moveTaskStatus);

  const igniteFlow = useCallback(
    (config) => {
      const { primaryTaskId, targetTaskIds, durationMinutes } = config;
      if (!primaryTaskId || !durationMinutes) return false;

      const tasks = useTaskStore.getState().tasks;
      const primary = tasks.find((t) => t.id === primaryTaskId);
      if (!primary) return false;

      moveTaskStatus(primaryTaskId, "In-Progress");
      setSession({
        primaryTaskId,
        targetTaskIds,
        primaryTaskTitle: primary.title,
        durationMinutes,
        startedAt: Date.now(),
      });
      setParkedThoughts([]);
      setPhase("active");
      setFlowFocusMode(true);
      return true;
    },
    [moveTaskStatus, setFlowFocusMode]
  );

  const completeFlowSession = useCallback(() => {
    setFlowFocusMode(false);
    setPhase("recovery");
  }, [setFlowFocusMode]);

  const finishRecovery = useCallback(() => {
    if (session) {
      const durationMs = session.durationMinutes * 60 * 1000;
      recordDeepWorkSession(session.primaryTaskId, durationMs);
    }
    setFlowFocusMode(false);
  }, [session, recordDeepWorkSession, setFlowFocusMode]);

  const exitAfterRecovery = useCallback(() => {
    setSession(null);
    setParkedThoughts([]);
    setPhase("setup");
  }, []);

  const parkDistraction = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setParkedThoughts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: trimmed, createdAt: Date.now() },
    ]);
  }, []);

  const removeParkedThought = useCallback((id) => {
    setParkedThoughts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetToSetup = useCallback(() => {
    setFlowFocusMode(false);
    setSession(null);
    setParkedThoughts([]);
    setPhase("setup");
  }, [setFlowFocusMode]);

  return {
    phase,
    session,
    parkedThoughts,
    defaultDurationMinutes: FLOW_DEFAULT_MINUTES,
    igniteFlow,
    completeFlowSession,
    finishRecovery,
    exitAfterRecovery,
    parkDistraction,
    removeParkedThought,
    resetToSetup,
  };
}
