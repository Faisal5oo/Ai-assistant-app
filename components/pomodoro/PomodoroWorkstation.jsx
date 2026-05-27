"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Timer } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { usePomodoroTimer } from "@/hooks/usePomodoroTimer";
import { playPomodoroChime } from "@/lib/pomodoroAudio";
import {
  BREAK_PROMPTS,
  PHASE_LABELS,
  POMODORO_DAILY_GOAL,
} from "@/lib/pomodoroConstants";
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

export function PomodoroWorkstation() {
  const tasks = useTaskStore((s) => s.tasks);
  const pomodoroDaily = useTaskStore((s) => s.pomodoroDaily);
  const recordComplete = useTaskStore((s) => s.recordPomodoroWorkComplete);
  const resolveDefaultTaskId = useTaskStore((s) => s.resolveDefaultTaskId);

  const [taskId, setTaskId] = useState(() => resolveDefaultTaskId() ?? "");
  const [breakPrompt, setBreakPrompt] = useState(
    () => BREAK_PROMPTS[Math.floor(Math.random() * BREAK_PROMPTS.length)]
  );

  const onSessionComplete = useCallback(
    (finishedPhase) => {
      playPomodoroChime();
      if (finishedPhase === "work") {
        recordComplete(taskId || null);
      }
    },
    [taskId, recordComplete]
  );

  const {
    phase,
    secondsLeft,
    progress,
    isRunning,
    start,
    pause,
    reset,
    skip,
  } = usePomodoroTimer({ onSessionComplete });

  useEffect(() => {
    if (phase === "shortBreak" || phase === "longBreak") {
      setBreakPrompt(
        BREAK_PROMPTS[Math.floor(Math.random() * BREAK_PROMPTS.length)]
      );
    }
  }, [phase]);

  const dailyCompleted = useMemo(() => {
    if (pomodoroDaily.date !== todayKey()) return 0;
    return pomodoroDaily.completed;
  }, [pomodoroDaily]);

  const dailyGoal = pomodoroDaily.goal ?? POMODORO_DAILY_GOAL;
  const timeLabel = formatSeconds(secondsLeft);
  const isBreak = phase === "shortBreak" || phase === "longBreak";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href="/productivity"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-charcoal/50 transition hover:text-charcoal"
      >
        <ArrowLeft size={16} />
        Productivity hub
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal">
            <Timer size={24} />
          </div>
          <h1 className="font-display text-3xl font-semibold">
            Pomodoro Workstation
          </h1>
          <p className="mt-2 max-w-xl text-sm text-charcoal/50">
            25-minute focus sprints, 5-minute short breaks, and 15-minute long
            breaks after every four cycles.
          </p>
        </div>
        <SessionTracker completed={dailyCompleted} goal={dailyGoal} />
      </div>

      <div className="glass-card mx-auto max-w-2xl p-8 md:p-10">
        <div className="mb-8 flex justify-center">
          <TaskSelector
            tasks={tasks}
            selectedId={taskId || null}
            onSelect={setTaskId}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center"
          >
            <CircularProgressRing
              progress={progress}
              timeLabel={timeLabel}
              phaseLabel={PHASE_LABELS[phase]}
            />
          </motion.div>
        </AnimatePresence>

        <div className="mt-8">
          <TimerControls
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
            onSkip={skip}
          />
        </div>

        <BreakGuideCard visible={isBreak} prompt={breakPrompt} />
      </div>
    </motion.div>
  );
}
