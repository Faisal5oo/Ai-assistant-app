"use client";

import { useCallback, useEffect, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { getTasksFromCache } from "@/lib/query-cache";
import { FLOW_DEFAULT_MINUTES } from "@/lib/flowConstants";
import { useWorkspaceMountSync } from "@/hooks/useWorkspaceMountSync";
import { readFlowSessionFromStorage } from "@/lib/flowStateStorage";

/**
 * @typedef {Object} FlowSession
 * @property {string} primaryTaskId
 * @property {string[]} targetTaskIds
 * @property {string[]} runwayQueue
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
  const igniteFlowSession = useTaskStore((s) => s.igniteFlowSession);
  const finalizeFlowSession = useTaskStore((s) => s.finalizeFlowSession);
  const clearFlowSession = useTaskStore((s) => s.clearFlowSession);
  const moveTaskStatus = useTaskStore((s) => s.moveTaskStatus);

  // ─── Cross-device mount recovery ──────────────────────────────────────────
  useWorkspaceMountSync("flow", {
    onFlow: useCallback(
      (workspace) => {
        // Already active in this tab — skip recovery
        if (phase !== "setup") return;

        const remote = workspace.activeFlowSession;
        const local = readFlowSessionFromStorage();

        // Prefer local (more current), fallback to remote
        const candidate = local ?? remote;
        if (!candidate?.primaryTaskId || !candidate?.startedAt) return;

        const totalMs = candidate.durationMinutes * 60 * 1000;
        const elapsedMs = Date.now() - candidate.startedAt;

        // Session expired — skip auto-mount
        if (elapsedMs >= totalMs) return;

        // Hydrate session — compute elapsed offset so the timer is correct
        setSession({
          primaryTaskId: candidate.primaryTaskId,
          primaryTaskTitle: candidate.primaryTaskTitle,
          targetTaskIds: candidate.targetTaskIds ?? [],
          runwayQueue: candidate.runwayQueue ?? [],
          durationMinutes: candidate.durationMinutes,
          // Rebase startedAt so countdown reflects live elapsed time
          startedAt: candidate.startedAt,
        });
        setPhase("active");
        setFlowFocusMode(true);
      },
      [phase, setFlowFocusMode]
    ),
  });

  const igniteFlow = useCallback(
    (config) => {
      const { primaryTaskId, targetTaskIds, runwayQueue, durationMinutes } = config;
      if (!primaryTaskId || !durationMinutes) return false;

      const tasks = getTasksFromCache();
      const primary = tasks.find((t) => t.id === primaryTaskId);
      if (!primary) return false;

      const startedAt = Date.now();

      moveTaskStatus(primaryTaskId, "In-Progress");

      const sessionPayload = {
        primaryTaskId,
        primaryTaskTitle: primary.title,
        targetTaskIds: targetTaskIds ?? [],
        runwayQueue: runwayQueue ?? [],
        durationMinutes,
        startedAt,
      };

      setSession({ ...sessionPayload });
      setParkedThoughts([]);
      setPhase("active");

      // Persist to Zustand + localStorage + DB
      igniteFlowSession(sessionPayload);

      return true;
    },
    [moveTaskStatus, igniteFlowSession]
  );

  const completeFlowSession = useCallback(() => {
    setFlowFocusMode(false);
    setPhase("recovery");
  }, [setFlowFocusMode]);

  const finishRecovery = useCallback(() => {
    if (session) {
      const actualDurationMs = session.durationMinutes * 60 * 1000;
      finalizeFlowSession({ actualDurationMs, status: "completed" });
    }
    setFlowFocusMode(false);
  }, [session, finalizeFlowSession, setFlowFocusMode]);

  const exitAfterRecovery = useCallback(() => {
    setSession(null);
    setParkedThoughts([]);
    setPhase("setup");
  }, []);

  const abandonFlow = useCallback(() => {
    if (session) {
      const actualDurationMs = Date.now() - session.startedAt;
      finalizeFlowSession({ actualDurationMs, status: "abandoned" });
    } else {
      clearFlowSession();
    }
    setSession(null);
    setParkedThoughts([]);
    setPhase("setup");
  }, [session, finalizeFlowSession, clearFlowSession]);

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
    clearFlowSession();
    setSession(null);
    setParkedThoughts([]);
    setPhase("setup");
  }, [clearFlowSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => setFlowFocusMode(false);
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
    abandonFlow,
    parkDistraction,
    removeParkedThought,
    resetToSetup,
  };
}
