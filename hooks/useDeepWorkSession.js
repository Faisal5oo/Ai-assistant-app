"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import {
  startDeepWorkSessionImperative,
  endDeepWorkSessionImperative,
} from "@/lib/imperative-mutations";
import {
  persistDeepWorkSession,
  purgeDeepWorkSession,
  checkpointDeepWorkSession,
} from "@/lib/deepWorkSessionSync";
import {
  readDeepWorkSessionFromStorage,
  toDeepWorkSessionFromPersisted,
  computeDeepWorkElapsedMinutes,
  computeMinutesSaved,
  purgeDeepWorkSessionStorage,
} from "@/lib/deepWorkSessionStorage";
import {
  reconcileDeepWorkSession,
  shouldPreferRemote,
  recalculateDeepWorkSession,
} from "@/lib/workspaceReconciliation";
import { fetchActiveWorkspace, checkpointDeepWorkSessionRemote } from "@/lib/workspaceSync";

/** @typedef {import('@/lib/deepWorkConstants').DeepWorkPhase} DeepWorkPhase */

/**
 * @typedef {Object} DeepWorkSession
 * @property {string} sessionId
 * @property {string} taskId
 * @property {string} taskTitle
 * @property {string} objective
 * @property {number} durationMinutes
 * @property {number} committedAt
 * @property {boolean} timerRunning
 * @property {number | null} timerStartedAt
 * @property {number | null} endsAt
 * @property {boolean} [timerFrozen]
 * @property {number | null} [frozenAt]
 */

/**
 * @typedef {Object} EarlyVictoryState
 * @property {number} minutesSaved
 */

export function useDeepWorkSession() {
  const [phase, setPhase] = useState(/** @type {DeepWorkPhase} */ ("setup"));
  const [session, setSession] = useState(/** @type {DeepWorkSession | null} */ (null));
  const [distractions, setDistractions] = useState(/** @type {string[]} */ ([]));
  const [showFrictionGate, setShowFrictionGate] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isAbandoning, setIsAbandoning] = useState(false);
  const [isClaimingEarly, setIsClaimingEarly] = useState(false);
  const [celebratingComplete, setCelebratingComplete] = useState(false);
  const [showEarlyCelebration, setShowEarlyCelebration] = useState(false);
  const [earlyVictory, setEarlyVictory] = useState(
    /** @type {EarlyVictoryState | null} */ (null)
  );
  const hydratedRef = useRef(false);

  const setDeepWorkFocusMode = useTaskStore((s) => s.setDeepWorkFocusMode);
  const completeTask = useTaskStore((s) => s.completeTask);

  const syncSession = useCallback(
    (nextSession, nextPhase, nextDistractions = distractions) => {
      if (!nextSession) return;
      persistDeepWorkSession(nextSession, nextPhase, nextDistractions);
    },
    [distractions]
  );

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let cancelled = false;

    const applyPersisted = (persisted) => {
      if (!persisted || cancelled) return;
      const restored = toDeepWorkSessionFromPersisted(persisted);
      setSession(restored);
      setDistractions(persisted.distractions ?? []);
      setPhase(persisted.phase === "recap" ? "recap" : "active");
      setDeepWorkFocusMode(persisted.phase === "active");
    };

    const hydrate = async () => {
      const local = readDeepWorkSessionFromStorage();

      try {
        const workspace = await fetchActiveWorkspace();
        if (cancelled) return;

        const remote = workspace.activeDeepWorkSession ?? null;
        const winner = reconcileDeepWorkSession(local, remote);

        if (!winner?.sessionId) {
          purgeDeepWorkSessionStorage();
          if (!cancelled) {
            setSession(null);
            setDistractions([]);
            setPhase("setup");
            setDeepWorkFocusMode(false);
          }
          return;
        }

        applyPersisted(winner);
        persistDeepWorkSession(
          toDeepWorkSessionFromPersisted(winner),
          winner.phase ?? "active",
          winner.distractions ?? []
        );

        if (local && remote && !shouldPreferRemote(local, remote)) {
          checkpointDeepWorkSessionRemote(recalculateDeepWorkSession(local));
        }
      } catch {
        if (local?.sessionId) {
          applyPersisted(local);
        } else if (!cancelled) {
          setSession(null);
          setPhase("setup");
          setDeepWorkFocusMode(false);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [setDeepWorkFocusMode]);

  const commitSession = useCallback(
    async (config) => {
      const { taskId, taskTitle, objective, durationMinutes } = config;
      if (!taskId || !objective.trim() || isCommitting) return false;

      setIsCommitting(true);
      try {
        const result = await startDeepWorkSessionImperative({
          taskId,
          objective: objective.trim(),
          plannedDurationMinutes: durationMinutes,
        });

        const nextSession = {
          sessionId: result.session.id,
          taskId,
          taskTitle,
          objective: objective.trim(),
          durationMinutes,
          committedAt: Date.now(),
          timerRunning: false,
          timerStartedAt: null,
          endsAt: null,
        };

        setSession(nextSession);
        setDistractions([]);
        setPhase("active");
        setDeepWorkFocusMode(true);
        syncSession(nextSession, "active", []);
        return true;
      } catch {
        return false;
      } finally {
        setIsCommitting(false);
      }
    },
    [isCommitting, setDeepWorkFocusMode, syncSession]
  );

  const activateTimer = useCallback(() => {
    if (!session || session.timerRunning) return;

    const now = Date.now();
    const nextSession = {
      ...session,
      timerRunning: true,
      timerStartedAt: now,
      endsAt: now + session.durationMinutes * 60_000,
    };

    setSession(nextSession);
    syncSession(nextSession, "active");
  }, [session, syncSession]);

  const completeSession = useCallback(() => {
    if (!session) return;
    setDeepWorkFocusMode(false);
    setPhase("recap");
    setShowFrictionGate(false);
    syncSession(session, "recap");
  }, [session, setDeepWorkFocusMode, syncSession]);

  const resolveSession = useCallback(
    async (objectiveAchieved) => {
      if (!session || isResolving) return;

      setIsResolving(true);
      const actualDurationMinutes = session.timerRunning
        ? session.endsAt && Date.now() >= session.endsAt
          ? session.durationMinutes
          : computeDeepWorkElapsedMinutes(session)
        : 0;

      try {
        await endDeepWorkSessionImperative({
          taskId: session.taskId,
          objective: session.objective,
          plannedDurationMinutes: session.durationMinutes,
          actualDurationMinutes,
          objectiveAchieved,
          status: "completed",
          ...(session.timerStartedAt
            ? { sessionStartedAt: new Date(session.timerStartedAt).toISOString() }
            : {}),
        });
      } finally {
        purgeDeepWorkSession();
        setIsResolving(false);
      }
    },
    [session, isResolving]
  );

  const markTaskComplete = useCallback(() => {
    if (!session || celebratingComplete) return;
    setCelebratingComplete(true);
  }, [session, celebratingComplete]);

  const finishTaskCelebration = useCallback(async () => {
    if (!session) return;
    try {
      await completeTask(session.taskId);
    } finally {
      setCelebratingComplete(false);
      setSession(null);
      setDistractions([]);
      setPhase("setup");
      setDeepWorkFocusMode(false);
      purgeDeepWorkSessionStorage();
    }
  }, [session, completeTask, setDeepWorkFocusMode]);

  const requestAbandon = useCallback(() => {
    setShowFrictionGate(true);
  }, []);

  const cancelFrictionGate = useCallback(() => {
    setShowFrictionGate(false);
  }, []);

  const confirmFrictionAbandon = useCallback(
    async (/** @type {import('@/lib/deepWorkConstants').DeepWorkAbandonReason} */ reason) => {
      if (!session || isAbandoning) return;

      setIsAbandoning(true);
      const actualDurationMinutes = computeDeepWorkElapsedMinutes(session);

      try {
        if (actualDurationMinutes > 0) {
          await endDeepWorkSessionImperative({
            taskId: session.taskId,
            objective: session.objective,
            plannedDurationMinutes: session.durationMinutes,
            actualDurationMinutes,
            objectiveAchieved: false,
            status: "abandoned",
            abandonReason: reason,
            ...(session.timerStartedAt
              ? { sessionStartedAt: new Date(session.timerStartedAt).toISOString() }
              : {}),
          });
        } else {
          await endDeepWorkSessionImperative({
            taskId: session.taskId,
            objective: session.objective,
            plannedDurationMinutes: session.durationMinutes,
            actualDurationMinutes: 0,
            objectiveAchieved: false,
            status: "abandoned",
            abandonReason: reason,
          });
        }
        purgeDeepWorkSessionStorage();
      } catch {
        return;
      } finally {
        setIsAbandoning(false);
      }

      setDeepWorkFocusMode(false);
      setSession(null);
      setDistractions([]);
      setShowFrictionGate(false);
      setPhase("setup");
    },
    [session, isAbandoning, setDeepWorkFocusMode]
  );

  const claimEarlyObjective = useCallback(async () => {
    if (!session || !session.timerRunning || session.timerFrozen || isClaimingEarly) {
      return;
    }

    setIsClaimingEarly(true);
    const frozenAt = Date.now();
    const frozenSession = {
      ...session,
      timerFrozen: true,
      frozenAt,
    };
    const minutesSaved = computeMinutesSaved(frozenSession);
    const actualDurationMinutes = computeDeepWorkElapsedMinutes(frozenSession);

    setSession(frozenSession);
    setShowEarlyCelebration(true);

    try {
      await endDeepWorkSessionImperative({
        taskId: session.taskId,
        objective: session.objective,
        plannedDurationMinutes: session.durationMinutes,
        actualDurationMinutes,
        objectiveAchieved: true,
        status: "completed",
        completedEarly: true,
        minutesSaved,
        completeTask: true,
        ...(session.timerStartedAt
          ? { sessionStartedAt: new Date(session.timerStartedAt).toISOString() }
          : {}),
      });
      purgeDeepWorkSession();
      setDeepWorkFocusMode(false);
      setTimeout(() => {
        setShowEarlyCelebration(false);
        setEarlyVictory({ minutesSaved });
      }, 1100);
    } catch {
      setShowEarlyCelebration(false);
      setSession(session);
    } finally {
      setIsClaimingEarly(false);
    }
  }, [session, isClaimingEarly, setDeepWorkFocusMode]);

  const dismissEarlyVictory = useCallback(() => {
    setShowEarlyCelebration(false);
    setEarlyVictory(null);
    setSession(null);
    setDistractions([]);
    setPhase("setup");
  }, []);

  const addDistraction = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed || !session) return;
      setDistractions((prev) => {
        const next = [...prev, trimmed];
        checkpointDeepWorkSession(session, phase, next);
        return next;
      });
    },
    [session, phase]
  );

  const resetToSetup = useCallback(() => {
    purgeDeepWorkSession();
    setDeepWorkFocusMode(false);
    setSession(null);
    setDistractions([]);
    setShowFrictionGate(false);
    setCelebratingComplete(false);
    setShowEarlyCelebration(false);
    setEarlyVictory(null);
    setPhase("setup");
  }, [setDeepWorkFocusMode]);

  const dismissRecap = useCallback(async () => {
    await resetToSetup();
  }, [resetToSetup]);

  return {
    phase,
    session,
    distractions,
    showFrictionGate,
    isCommitting,
    isResolving,
    isAbandoning,
    isClaimingEarly,
    celebratingComplete,
    showEarlyCelebration,
    earlyVictory,
    commitSession,
    activateTimer,
    completeSession,
    resolveSession,
    markTaskComplete,
    finishTaskCelebration,
    requestAbandon,
    cancelFrictionGate,
    confirmFrictionAbandon,
    claimEarlyObjective,
    dismissEarlyVictory,
    addDistraction,
    resetToSetup,
    dismissRecap,
  };
}
