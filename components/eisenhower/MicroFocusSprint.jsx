"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Pause, Play, Square } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

const SPRINT_TWEEN = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

const CONTENT_FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: SPRINT_TWEEN,
};

const BUTTON_VICTORY = {
  initial: { opacity: 1, scale: 1 },
  animate: {
    opacity: 0,
    scale: 1.55,
    y: -8,
    filter: "blur(4px)",
  },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
};

/**
 * @param {number} ms
 */
function formatMs(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {boolean} props.controlsVisible
 * @param {boolean} props.isClosing
 * @param {() => void} props.onStop
 * @param {() => void} props.onMarkComplete
 */
export function MicroFocusSprint({
  task,
  controlsVisible,
  isClosing,
  onStop,
  onMarkComplete,
}) {
  const recordDeepWorkSession = useTaskStore((s) => s.recordDeepWorkSession);
  const [running, setRunning] = useState(true);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [buttonVictory, setButtonVictory] = useState(false);
  const startedRef = useRef(Date.now());
  const tickRef = useRef(
    /** @type {ReturnType<typeof setInterval> | null} */ (null)
  );

  useEffect(() => {
    if (!running) return undefined;
    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startedRef.current);
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [running]);

  const handleStop = useCallback(() => {
    if (buttonVictory) return;
    if (elapsedMs > 0) {
      recordDeepWorkSession(task.id, elapsedMs);
    }
    onStop();
  }, [buttonVictory, elapsedMs, onStop, recordDeepWorkSession, task.id]);

  const handleComplete = useCallback(() => {
    if (buttonVictory) return;
    if (elapsedMs > 0) {
      recordDeepWorkSession(task.id, elapsedMs);
    }
    setButtonVictory(true);
  }, [buttonVictory, elapsedMs, recordDeepWorkSession, task.id]);

  const handleButtonVictoryComplete = useCallback(() => {
    if (!buttonVictory) return;
    onMarkComplete();
  }, [buttonVictory, onMarkComplete]);

  const togglePause = () => {
    if (buttonVictory) return;
    if (running) {
      if (tickRef.current) clearInterval(tickRef.current);
      setRunning(false);
    } else {
      startedRef.current = Date.now() - elapsedMs;
      setRunning(true);
    }
  };

  const showControls = controlsVisible && !isClosing && !buttonVictory;
  const showCompleteBtn = showControls;

  return (
    <div className="w-full overflow-visible">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Micro-focus sprint
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-semibold tracking-tight text-charcoal">
        {task.title}
      </p>

      <AnimatePresence initial={false}>
        {showControls ? (
          <motion.div
            key="sprint-timer-controls"
            {...CONTENT_FADE}
            className="overflow-visible"
          >
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums tracking-tight text-charcoal">
              {formatMs(elapsedMs)}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={togglePause}
                className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-charcoal text-xs font-medium text-white"
              >
                {running ? <Pause size={14} /> : <Play size={14} />}
                {running ? "Pause" : "Resume"}
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-charcoal shadow-glass"
                aria-label="End sprint"
              >
                <Square size={14} />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {!buttonVictory && showCompleteBtn && (
          <motion.button
            key="complete-btn"
            type="button"
            layout={false}
            onClick={handleComplete}
            data-eisenhower-no-drag
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SPRINT_TWEEN}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(5,150,105,0.35)] transition-[filter] duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <CheckCircle size={18} strokeWidth={2.25} />
            Mark Complete
          </motion.button>
        )}
        {buttonVictory && (
          <motion.button
            key="complete-btn-burst"
            type="button"
            layout={false}
            disabled
            {...BUTTON_VICTORY}
            onAnimationComplete={handleButtonVictoryComplete}
            data-eisenhower-no-drag
            className="pointer-events-none mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white shadow-[0_0_32px_rgba(16,185,129,0.65)]"
          >
            <motion.span
              animate={{ scale: [1, 1.2, 0.8], rotate: [0, 8, -4] }}
              transition={{ duration: 0.38 }}
            >
              <CheckCircle size={20} strokeWidth={2.5} />
            </motion.span>
            Mark Complete
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
