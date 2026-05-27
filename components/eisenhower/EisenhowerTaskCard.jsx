"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, Play, X } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { MicroFocusSprint } from "./MicroFocusSprint";
import { SprintVictoryEffects } from "./SprintVictoryEffects";
import { DelegateSlideMenu } from "./DelegateSlideMenu";
import { PurgeExitAnimation } from "./PurgeExitAnimation";

const DRAG_THRESHOLD_PX = 5;

const PLAY_FADE = {
  initial: { opacity: 0, scale: 0.75 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.72 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
};

const CARD_LAYOUT_TWEEN = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.25,
};

/** Inner content cross-fade — synced with parent layout morph */
const CONTENT_CROSSFADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: CARD_LAYOUT_TWEEN,
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {import('@/types/interfaces').EisenhowerQuadrant | 'inbox'} props.zone
 * @param {boolean} props.isDragging
 * @param {(taskId: string, title: string, x: number, y: number, sourceZone: string) => void} props.onDragStart
 * @param {(taskId: string) => void} [props.onPurge]
 * @param {(taskId: string, meta: object) => void} [props.onUpdateMeta]
 * @param {boolean} [props.isPurging]
 */
export function EisenhowerTaskCard({
  task,
  zone,
  isDragging,
  onDragStart,
  onPurge,
  onUpdateMeta,
  isPurging = false,
}) {
  const moveTaskStatus = useTaskStore((s) => s.moveTaskStatus);
  const [hovered, setHovered] = useState(false);
  const [isSprintActive, setIsSprintActive] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState(
    /** @type {null | 'glow' | 'exit'} */ (null)
  );
  const [victoryExit, setVictoryExit] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [localPurging, setLocalPurging] = useState(false);
  const dragPendingRef = useRef(
    /** @type {{ x: number; y: number; pointerId: number } | null} */ (null)
  );
  const victoryCommittedRef = useRef(false);
  const purging = isPurging || localPurging;

  const isQ1 = zone === 1;
  const isQ3 = zone === 3;
  const isQ4 = zone === 4;
  const sprintLocked = isSprintActive || victoryExit;

  const handlePurge = () => {
    if (!onPurge || purging) return;
    setLocalPurging(true);
    onPurge(task.id);
  };

  const commitDrag = useCallback(
    (clientX, clientY) => {
      onDragStart(task.id, task.title, clientX, clientY, String(zone));
    },
    [onDragStart, task.id, task.title, zone]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (sprintLocked) return;
      if (e.button !== 0) return;
      if (e.target.closest("[data-eisenhower-no-drag]")) return;

      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const pointerId = e.pointerId;
      dragPendingRef.current = { x: startX, y: startY, pointerId };

      const cleanup = () => {
        dragPendingRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
      };

      const onMove = (ev) => {
        if (
          !dragPendingRef.current ||
          ev.pointerId !== dragPendingRef.current.pointerId
        ) {
          return;
        }
        const dx = ev.clientX - dragPendingRef.current.x;
        const dy = ev.clientY - dragPendingRef.current.y;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
          cleanup();
          commitDrag(ev.clientX, ev.clientY);
        }
      };

      const onUp = () => {
        cleanup();
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [commitDrag, sprintLocked]
  );

  const closeSprint = useCallback(() => {
    if (!isSprintActive || victoryExit) return;
    setIsSprintActive(false);
  }, [isSprintActive, victoryExit]);

  const startSprint = useCallback(() => {
    setVictoryPhase(null);
    setVictoryExit(false);
    victoryCommittedRef.current = false;
    setIsSprintActive(true);
  }, []);

  const handleMarkComplete = useCallback(() => {
    setVictoryPhase("glow");
    window.setTimeout(() => {
      setVictoryPhase("exit");
      setVictoryExit(true);
    }, 520);
  }, []);

  const handleVictoryAnimationComplete = useCallback(() => {
    if (!victoryExit || victoryCommittedRef.current) return;
    victoryCommittedRef.current = true;
    moveTaskStatus(task.id, "Completed");
  }, [moveTaskStatus, task.id, victoryExit]);

  const showPlaySlot =
    isQ1 && !isSprintActive && !victoryExit && !isDragging;

  return (
    <div className="relative select-none">
      {isDragging && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 min-h-[2.75rem] rounded-2xl border border-dashed border-gold/25 bg-gold/[0.06]"
        />
      )}

      {purging && <PurgeExitAnimation onComplete={() => {}} />}

      <AnimatePresence>
        {isSprintActive && !victoryExit && (
          <motion.div
            key="sprint-focus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none absolute -inset-2 z-0 rounded-3xl bg-black/5 backdrop-blur-[2px]"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{
          opacity: isDragging ? 0 : purging ? 0 : isQ4 && hovered ? 0.4 : 1,
          scale: purging ? 0.85 : 1,
        }}
        transition={CARD_LAYOUT_TWEEN}
        className="relative"
        style={{ zIndex: isSprintActive || victoryExit ? 50 : 1 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <motion.div
          layout
          layoutId={isQ1 ? `eisenhower-q1-${task.id}` : undefined}
          transition={CARD_LAYOUT_TWEEN}
          onAnimationComplete={handleVictoryAnimationComplete}
          animate={{
            opacity: victoryExit ? 0 : 1,
            scale: victoryExit ? 0.42 : 1,
            rotate: victoryExit ? 6 : 0,
            y: victoryExit ? -12 : 0,
            boxShadow: victoryPhase === "glow"
              ? "0 0 0 2px rgba(52, 211, 153, 0.55), 0 0 36px rgba(34, 197, 94, 0.35)"
              : victoryExit
                ? "0 0 0 0px transparent, 0 0 0px transparent"
                : "0 0 0 0px transparent",
          }}
          role="button"
          tabIndex={sprintLocked ? -1 : 0}
          drag={false}
          onPointerDown={handlePointerDown}
          onKeyDown={(e) => {
            if (isQ3 && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              setDelegateOpen((v) => !v);
            }
          }}
          onClick={() => {
            if (isDragging || dragPendingRef.current || sprintLocked) return;
            if (isQ3) setDelegateOpen((v) => !v);
          }}
          className={`group relative flex w-full select-none touch-none pointer-events-auto text-left shadow-glass backdrop-blur-sm [touch-action:none] [-webkit-user-drag:none] ${
            isDragging ? "invisible" : ""
          } ${
            isSprintActive
              ? "flex-col overflow-visible rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/20 via-white to-white p-4"
              : `min-h-[2.75rem] items-center gap-2 overflow-hidden rounded-2xl border border-white/70 bg-white/85 px-3 py-2.5 ${
                  isQ3 ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                }`
          }`}
          style={{
            WebkitTouchCallout: "none",
            userSelect: "none",
          }}
        >
          {victoryPhase && (
            <SprintVictoryEffects phase={victoryPhase === "glow" ? "glow" : "exit"} />
          )}

          <div className="relative w-full min-h-[2.75rem] flex-1">
            <AnimatePresence mode="wait" initial={false}>
              {!isSprintActive && (
                <motion.div
                  key="task-default"
                  layout={false}
                  {...CONTENT_CROSSFADE}
                  className="flex h-full w-full min-h-[2.75rem] items-center gap-2 overflow-hidden pr-9"
                >
                  <div
                    className="flex shrink-0 items-center text-charcoal/30 transition-colors duration-200 group-hover:text-gold/90"
                    aria-hidden
                  >
                    <GripVertical size={14} strokeWidth={2} />
                  </div>

                  <div className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col justify-center self-stretch">
                    <p className="line-clamp-2 text-sm font-medium leading-snug tracking-tight text-charcoal">
                      {task.title}
                    </p>
                    {isQ3 && (task.delegateTo || task.automateCandidate) && (
                      <p className="mt-0.5 text-[10px] leading-tight text-charcoal/45">
                        {task.delegateTo && `→ ${task.delegateTo}`}
                        {task.delegateTo && task.automateCandidate && " · "}
                        {task.automateCandidate && "Auto"}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {isSprintActive && (
                <motion.div
                  key="task-sprint"
                  layout={false}
                  {...CONTENT_CROSSFADE}
                  className="flex h-full w-full flex-col"
                >
                  <MicroFocusSprint
                    task={task}
                    controlsVisible
                    isClosing={false}
                    onStop={closeSprint}
                    onMarkComplete={handleMarkComplete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {isQ4 && !isSprintActive && (
            <div
              className="relative ml-auto h-8 w-8 shrink-0"
              data-eisenhower-no-drag
            >
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurge();
                }}
                className={`absolute inset-0 flex items-center justify-center rounded-full bg-charcoal/10 text-charcoal/50 transition-[opacity,background-color,color] duration-200 hover:bg-charcoal hover:text-white ${
                  hovered && !isDragging
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
                aria-label={`Purge ${task.title}`}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <AnimatePresence>
            {showPlaySlot && (
              <motion.button
                key="play-btn"
                type="button"
                layout={false}
                initial={PLAY_FADE.initial}
                animate={{
                  opacity: hovered ? 1 : 0,
                  scale: hovered ? 1 : 0.72,
                }}
                exit={PLAY_FADE.exit}
                transition={PLAY_FADE.transition}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  startSprint();
                }}
                data-eisenhower-no-drag
                className={`absolute right-2.5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-charcoal text-white shadow-soft ${
                  hovered ? "pointer-events-auto" : "pointer-events-none"
                }`}
                aria-label={`Start sprint on ${task.title}`}
              >
                <Play size={14} className="ml-0.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {isQ3 && onUpdateMeta && (
        <DelegateSlideMenu
          task={task}
          open={delegateOpen}
          onClose={() => setDelegateOpen(false)}
          onUpdate={(meta) => onUpdateMeta(task.id, meta)}
        />
      )}
    </div>
  );
}
