"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useDashboard } from "@/hooks/queries/useDashboardQuery";
import { useProductivitySummary } from "@/hooks/queries/useProductivitySummaryQuery";
import { usePomodoroTimer, readLocalPomodoroTimerDisplayState } from "@/hooks/usePomodoroTimer";
import { playPomodoroChime } from "@/lib/pomodoroAudio";
import {
  BREAK_PROMPTS,
  PHASE_LABELS,
  POMODORO_DAILY_GOAL,
  POMODORO_SECONDS,
} from "@/lib/pomodoroConstants";
import {
  elapsedMinutesFromTimer,
  phaseToSessionType,
  purgePomodoroSessionStorage,
  readPomodoroSessionFromStorage,
  writePomodoroSessionToStorage,
} from "@/lib/pomodoroSessionStorage";
import { useWorkspaceMountSync } from "@/hooks/useWorkspaceMountSync";
import {
  reconcilePomodoroTimer,
  shouldPreferRemote,
  recalculatePomodoroTimer,
} from "@/lib/workspaceReconciliation";
import {
  checkpointPomodoroTimerRemote,
  clearPomodoroTimerRemote,
} from "@/lib/workspaceSync";
import { todayKey } from "@/lib/utils";
import { CircularProgressRing } from "./CircularProgressRing";
import { SessionTracker } from "./SessionTracker";
import { BreakGuideCard } from "./BreakGuideCard";
import { TaskSelector } from "./TaskSelector";
import { TimerControls } from "./TimerControls";

function formatSeconds(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SHAKE = {
  x: [0, -5, 5, -3, 3, -1, 1, 0],
  transition: { duration: 0.48, ease: "easeOut" },
};

const SPRING_CARD = { type: "spring", stiffness: 200, damping: 22 };

const PHASE_GLOW_COLOR = {
  work: "rgba(250,204,21,0.28)",
  shortBreak: "rgba(74,222,128,0.20)",
  longBreak: "rgba(96,165,250,0.18)",
};

export function PomodoroWorkstation() {
  const { tasks } = useTasks();
  const { pomodoroDaily } = useDashboard();
  const { refetch: refetchSummary } = useProductivitySummary();
  const recordComplete = useTaskStore((s) => s.recordPomodoroWorkComplete);
  const startPomodoroSession = useTaskStore((s) => s.startPomodoroSession);
  const endPomodoroSession = useTaskStore((s) => s.endPomodoroSession);
  const resolveDefaultTaskId = useTaskStore((s) => s.resolveDefaultTaskId);
  const completeTask = useTaskStore((s) => s.completeTask);
  const setPomodoroFocusMode = useTaskStore((s) => s.setPomodoroFocusMode);

  const [taskId, setTaskId] = useState(() => resolveDefaultTaskId() ?? "");
  const [breakPrompt, setBreakPrompt] = useState(
    () => BREAK_PROMPTS[Math.floor(Math.random() * BREAK_PROMPTS.length)]
  );
  const [didComplete, setDidComplete] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(25);
  const containerControls = useAnimationControls();
  const timeoutRef = useRef(null);
  const activeSessionRef = useRef(readPomodoroSessionFromStorage());
  const restoreTimerRef = useRef(/** @type {((remote: import('@/lib/workspaceReconciliation').PomodoroTimerState) => void) | null} */ (null));

  const onSessionComplete = useCallback(
    (finishedPhase, { totalSeconds, secondsLeft }) => {
      playPomodoroChime();

      const type = phaseToSessionType(finishedPhase);
      const duration =
        finishedPhase === "work"
          ? workMinutes
          : elapsedMinutesFromTimer(totalSeconds, secondsLeft);

      if (finishedPhase === "work") {
        recordComplete(taskId || null, duration);
        setDidComplete(true);
        containerControls.start(SHAKE);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setDidComplete(false), 2200);
      } else {
        endPomodoroSession({
          taskId: taskId || null,
          type,
          duration,
          status: "completed",
          sessionStartedAt: activeSessionRef.current?.startedAt,
        });
      }

      purgePomodoroSessionStorage();
      activeSessionRef.current = null;
      clearPomodoroTimerRemote();
      refetchSummary();
    },
    [
      taskId,
      recordComplete,
      endPomodoroSession,
      containerControls,
      workMinutes,
      refetchSummary,
    ]
  );

  const {
    phase,
    secondsLeft,
    totalSeconds,
    progress,
    isRunning,
    start: timerStart,
    pause,
    reset: timerReset,
    skip: timerSkip,
    restoreFromRemote,
  } = usePomodoroTimer({
    onSessionComplete,
    customWorkSeconds: workMinutes * 60,
    sessionMetaRef: activeSessionRef,
  });

  restoreTimerRef.current = restoreFromRemote;

  useWorkspaceMountSync("pomodoro", {
    onPomodoro: useCallback((workspace) => {
      const display = readLocalPomodoroTimerDisplayState();
      const localRaw = readPomodoroSessionFromStorage();
      const local =
        localRaw && display
          ? {
              sessionId: localRaw.id,
              taskId: localRaw.taskId ?? null,
              phase: display.phase ?? "work",
              type: phaseToSessionType(display.phase ?? "work"),
              secondsLeft: display.secondsLeft ?? 0,
              isRunning: Boolean(display.isRunning),
              workMinutes: 25,
              cycle: display.cycle ?? 0,
              startedAt: localRaw.startedAt,
              timerStartedAt: display.isRunning ? Date.now() : null,
              updatedAt: display.savedAt ?? Date.now(),
            }
          : null;

      const remote = workspace.activePomodoroTimer ?? null;
      const winner = reconcilePomodoroTimer(local, remote);

      if (winner) {
        const recalculated = recalculatePomodoroTimer(winner);
        restoreTimerRef.current?.(recalculated);
        if (recalculated.taskId) setTaskId(recalculated.taskId);
        activeSessionRef.current = {
          id: recalculated.sessionId,
          taskId: recalculated.taskId ?? null,
          type: recalculated.type,
          startedAt: recalculated.startedAt,
          phase: recalculated.phase,
        };
        writePomodoroSessionToStorage(activeSessionRef.current);
      }

      if (local && remote && !shouldPreferRemote(local, remote)) {
        checkpointPomodoroTimerRemote(recalculatePomodoroTimer(local));
      }
    }, []),
  });

  const finalizeAbandonedSession = useCallback(() => {
    const session = activeSessionRef.current;
    if (!session) return;

    const duration = elapsedMinutesFromTimer(totalSeconds, secondsLeft);
    if (duration <= 0) {
      purgePomodoroSessionStorage();
      activeSessionRef.current = null;
      clearPomodoroTimerRemote();
      return;
    }

    endPomodoroSession({
      taskId: session.taskId,
      type: session.type,
      duration,
      status: "abandoned",
      sessionStartedAt: session.startedAt,
    });

    purgePomodoroSessionStorage();
    activeSessionRef.current = null;
    clearPomodoroTimerRemote();
    refetchSummary();
  }, [endPomodoroSession, totalSeconds, secondsLeft, refetchSummary]);

  const handleStart = useCallback(async () => {
    const type = phaseToSessionType(phase);
    const plannedDurationMinutes =
      phase === "work"
        ? workMinutes
        : Math.round((POMODORO_SECONDS[phase === "shortBreak" ? "shortBreak" : "longBreak"] / 60) * 100) / 100;

    try {
      const result = await startPomodoroSession({
        taskId: taskId || null,
        type,
        plannedDurationMinutes,
      });

      activeSessionRef.current = {
        id: result.session.id,
        taskId: result.session.taskId,
        type: result.session.type,
        startedAt: result.session.startedAt,
        plannedDurationMinutes,
        phase,
      };
      writePomodoroSessionToStorage(activeSessionRef.current);
      timerStart();
    } catch {
      /* toast handled in imperative layer */
    }
  }, [phase, workMinutes, taskId, startPomodoroSession, timerStart]);

  const handleReset = useCallback(() => {
    finalizeAbandonedSession();
    timerReset();
  }, [finalizeAbandonedSession, timerReset]);

  const handleSkip = useCallback(() => {
    finalizeAbandonedSession();
    timerSkip();
  }, [finalizeAbandonedSession, timerSkip]);

  const handleCompleteTask = useCallback(() => {
    if (!taskId) return;
    completeTask(taskId);
    refetchSummary();
  }, [taskId, completeTask, refetchSummary]);

  useEffect(() => {
    setPomodoroFocusMode(isRunning);
    return () => setPomodoroFocusMode(false);
  }, [isRunning, setPomodoroFocusMode]);

  useEffect(() => {
    if (phase === "shortBreak" || phase === "longBreak") {
      setBreakPrompt(BREAK_PROMPTS[Math.floor(Math.random() * BREAK_PROMPTS.length)]);
    }
  }, [phase]);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  const dailyCompleted = useMemo(() => {
    if (pomodoroDaily.date !== todayKey()) return 0;
    return pomodoroDaily.completed;
  }, [pomodoroDaily]);

  const dailyGoal = pomodoroDaily.goal ?? POMODORO_DAILY_GOAL;
  const timeLabel = formatSeconds(secondsLeft);
  const isBreak = phase === "shortBreak" || phase === "longBreak";
  const glowColor = PHASE_GLOW_COLOR[phase];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-[calc(100vh-6rem)] pb-16"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 560,
          height: 560,
          background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 65%)`,
          filter: "blur(72px)",
        }}
        animate={
          isRunning
            ? { opacity: [1, 1.4, 1], scale: [1, 1.08, 1] }
            : { opacity: 0.45, scale: 1 }
        }
        transition={
          isRunning
            ? { duration: 10, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }
            : { duration: 1.2, ease: "easeInOut" }
        }
      />

      <Link
        href="/productivity"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/45 transition hover:text-charcoal"
      >
        <ArrowLeft size={15} strokeWidth={2} />
        Productivity Hub
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h1 className="font-display text-3xl font-semibold text-charcoal">
            Pomodoro Focus
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-charcoal/50">
            Focus sessions track time investment — completing a pomodoro does not mark
            your task done. Finish tasks explicitly when the outcome is reached.
          </p>
        </div>
        <SessionTracker completed={dailyCompleted} goal={dailyGoal} isRunning={isRunning} />
      </div>

      <motion.div animate={containerControls} className="mx-auto max-w-xl">
        <motion.div
          whileHover={isRunning ? { scale: 1.003 } : {}}
          transition={SPRING_CARD}
          className="glass-card relative overflow-hidden p-8 md:p-10"
        >
          <AnimatePresence>
            {isRunning && (
              <motion.div
                key="card-shimmer"
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-[2rem]"
                initial={{ backgroundPosition: "-200% 0%" }}
                animate={{ backgroundPosition: ["−200% 0%", "200% 0%"] }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                style={{
                  background:
                    "linear-gradient(105deg, transparent 35%, rgba(250,204,21,0.08) 50%, transparent 65%)",
                  backgroundSize: "200% 100%",
                }}
              />
            )}
          </AnimatePresence>

          <motion.div
            className="mb-8 flex justify-center"
            animate={{
              opacity: isRunning ? 0.35 : 1,
              pointerEvents: isRunning ? "none" : "auto",
            }}
            transition={{ duration: 0.5 }}
          >
            <TaskSelector
              tasks={tasks}
              selectedId={taskId || null}
              onSelect={setTaskId}
              isRunning={isRunning}
              onCompleteTask={handleCompleteTask}
            />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center"
            >
              <CircularProgressRing
                progress={progress}
                timeLabel={timeLabel}
                phaseLabel={PHASE_LABELS[phase]}
                phase={phase}
                isRunning={isRunning}
                didComplete={didComplete}
                workMinutes={workMinutes}
                onWorkMinutesChange={setWorkMinutes}
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-8">
            <TimerControls
              isRunning={isRunning}
              onStart={handleStart}
              onPause={pause}
              onReset={handleReset}
              onSkip={handleSkip}
            />
          </div>

          <BreakGuideCard visible={isBreak} prompt={breakPrompt} isRunning={isRunning} />
        </motion.div>
      </motion.div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {Array.from({ length: 4 }, (_, i) => {
          const filled = i < (dailyCompleted % 4);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.06, type: "spring", stiffness: 320 }}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                filled
                  ? "w-8 bg-gold shadow-[0_0_8px_rgba(250,204,21,0.4)]"
                  : "w-4 bg-charcoal/12"
              }`}
            />
          );
        })}
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-charcoal/30">
          Cycle
        </span>
      </div>
    </motion.div>
  );
}
