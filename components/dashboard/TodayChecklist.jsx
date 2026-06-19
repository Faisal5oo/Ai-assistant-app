"use client";

import { useCallback, useMemo, useRef, useEffect } from "react";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Users,
  Monitor,
  FileText,
  Calendar,
  GripVertical,
  Play,
  Sparkles,
} from "lucide-react";
import { FocusQueueBadge } from "@/components/tasks/FocusQueueBadge";
import { useActivateFocusTask } from "@/hooks/useActivateFocusTask";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { velocityToast } from "@/lib/toast";
import {
  useToggleTaskCompleteMutation,
  useReorderTasksMutation,
} from "@/hooks/queries/useTaskMutations";
import { useKanbanDrag } from "@/hooks/useKanbanDrag";
import { KanbanDragGhost } from "@/components/tasks/KanbanDragGhost";
import { AnimatedTaskCheckbox } from "@/components/dashboard/AnimatedTaskCheckbox";
import { useTaskStore } from "@/store/useTaskStore";
import { formatScheduledTime } from "@/lib/utils";
import { KANBAN_MORPH_SPRING } from "@/lib/kanban";
import { getTodayDisplayTasks } from "@/lib/todayTasks";
import { format } from "date-fns";
import { ActiveTimeBlockHero } from "@/components/dashboard/ActiveTimeBlockHero";
import { useCurrentClock } from "@/hooks/useCurrentClock";
import { getActiveTimeBlockTaskIds, getActiveRunwayAllocations, getCurrentHour } from "@/lib/timeBlocking";
import { buildRunwayFocusTimerOptions } from "@/lib/runway-focus";
import { StartFocusSessionButton } from "@/components/runway/StartFocusSessionButton";

const TODAY_ZONE = "Today";
const DRAG_THRESHOLD_PX = 5;
const ICONS = [Video, Users, Monitor, FileText, Calendar, Video, Users, Monitor];

const FOCUS_EASE = { duration: 0.35, ease: "easeInOut" };

/**
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {string} draggedId
 * @param {number} dropIndex
 * @returns {import('@/types/interfaces').Task[]}
 */
function reorderDisplayList(tasks, draggedId, dropIndex) {
  const startIndex = tasks.findIndex((t) => t.id === draggedId);
  if (startIndex < 0) return tasks;

  const without = tasks.filter((t) => t.id !== draggedId);
  const endIndex = Math.max(0, Math.min(dropIndex, without.length));
  if (endIndex === startIndex) return tasks;

  const next = [...without];
  next.splice(endIndex, 0, tasks[startIndex]);
  return next;
}

/**
 * @param {import('@/types/interfaces').Task[]} orderedTasks
 * @param {import('@/types/interfaces').TaskStatus} status
 * @returns {string[]}
 */
function taskIdsForStatus(orderedTasks, status) {
  return orderedTasks.filter((t) => t.status === status).map((t) => t.id);
}

export function OnboardingProgress() {
  const { tasks } = useTasks();
  const done = tasks.filter((t) => t.status === "Completed").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <motion.p
        key={pct}
        initial={{ scale: 0.92, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-3xl font-display font-semibold"
      >
        {pct}%
      </motion.p>
      <p className="mb-3 text-xs text-charcoal/50">Daily completion</p>
      <div className="flex h-2 overflow-hidden rounded-full bg-charcoal/10">
        <motion.div
          className="h-full rounded-full bg-gold"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <p className="mt-2 text-xs text-charcoal/40">
        {done} of {tasks.length} tasks done
      </p>
    </div>
  );
}

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task} props.task
 * @param {number} props.index
 * @param {boolean} props.isDragging
 * @param {boolean} props.isFocusRunning
 * @param {boolean} props.isFocusPaused
 * @param {boolean} props.isInQueue
 * @param {boolean} props.isTopFocus
 * @param {boolean} props.isActiveTimeBlock
 * @param {boolean} props.isRunwayFocusReady
 * @param {boolean} props.isRunwayPrimary
 * @param {boolean} [props.isHighlighted]
 * @param {object} [props.layoutTransition]
 * @param {number} [props.slotDurationMinutes]
 * @param {(taskId: string, title: string, x: number, y: number) => void} props.onDragStart
 * @param {(task: import('@/types/interfaces').Task) => void} props.onToggle
 * @param {() => void} [props.onActivate]
 * @param {boolean} props.isPending
 */
function TodayTaskRow({
  task,
  index,
  isDragging,
  isFocusRunning,
  isFocusPaused,
  isInQueue,
  isTopFocus,
  isActiveTimeBlock,
  isRunwayFocusReady,
  isRunwayPrimary,
  isHighlighted,
  layoutTransition,
  slotDurationMinutes,
  onDragStart,
  onToggle,
  onActivate,
  isPending,
}) {
  const dragPendingRef = useRef(
    /** @type {{ x: number; y: number; pointerId: number } | null} */ (null)
  );
  const Icon = ICONS[index % ICONS.length];
  const timeLabel = task.scheduledAt
    ? formatScheduledTime(task.scheduledAt)
    : format(new Date(task.createdAt), "MMM d");
  const done = task.status === "Completed";

  const commitDrag = useCallback(
    (clientX, clientY) => {
      onDragStart(task.id, task.title, clientX, clientY);
    },
    [onDragStart, task.id, task.title]
  );

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      if (e.target.closest("[data-today-no-drag]")) return;

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

      const onUp = () => cleanup();

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    },
    [commitDrag]
  );

  return (
    <motion.li
      layout
      layoutId={task.id}
      data-kanban-task-id={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging ? 0.35 : 1,
        y: 0,
        scale:
          isHighlighted ||
          isTopFocus ||
          (isRunwayFocusReady && isRunwayPrimary)
            ? 1.02
            : 1,
      }}
      exit={{ opacity: 0, x: -12, transition: { duration: 0.2 } }}
      transition={
        layoutTransition ?? { ...KANBAN_MORPH_SPRING, delay: index * 0.03 }
      }
      onPointerDown={handlePointerDown}
      className={`group relative list-none overflow-visible [touch-action:none] ${
        isDragging ? "invisible" : ""
      }`}
    >
      <motion.div
        layout
        transition={FOCUS_EASE}
        className={`relative flex items-center gap-3 overflow-visible rounded-2xl p-2 ${
          done
            ? "bg-white/[0.03]"
            : isHighlighted
              ? "ring-2 ring-gold/70 bg-gradient-to-r from-gold/20 via-amber-300/15 to-transparent shadow-[0_0_32px_rgba(250,204,21,0.30)]"
              : isTopFocus
                ? "ring-2 ring-gold/55 shadow-[0_0_24px_rgba(250,204,21,0.18)]"
                : isRunwayFocusReady && isRunwayPrimary
                  ? "ring-2 ring-gold/50 shadow-[0_0_28px_rgba(250,204,21,0.22)]"
                  : isActiveTimeBlock
                    ? "ring-1 ring-gold/40 bg-gradient-to-r from-gold/15 via-amber-400/10 to-transparent shadow-[0_0_20px_rgba(250,204,21,0.1)]"
                    : "bg-white/5"
        }`}
      >
        <AnimatePresence mode="sync" initial={false}>
          {isHighlighted && !done && (
            <motion.div
              key="highlight-glow"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.85, 0.5, 0.75, 0.3, 0] }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              transition={{ duration: 4.5, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-r from-gold/35 via-amber-200/25 to-transparent"
            />
          )}
          {isRunwayFocusReady && isRunwayPrimary && !isFocusRunning && (
            <motion.div
              key="runway-ready"
              aria-hidden
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{
                opacity: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
              }}
              className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gold/20 via-amber-400/10 to-charcoal/20"
            />
          )}
          {isFocusRunning && (
            <>
              <motion.div
                key="focus-base"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={FOCUS_EASE}
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gold/35 via-amber-300/20 to-yellow-500/12"
              />
              <motion.div
                key="focus-pulse"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.45, 0.85, 0.45] }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{
                  opacity: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                  default: FOCUS_EASE,
                }}
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br from-gold/25 via-amber-200/15 to-transparent"
              />
              <motion.div
                key="focus-shift"
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{
                  opacity: FOCUS_EASE,
                  backgroundPosition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  },
                }}
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(100deg, transparent 15%, rgba(250,204,21,0.4) 50%, transparent 85%)",
                  backgroundSize: "220% 100%",
                }}
              />
            </>
          )}
        </AnimatePresence>

        <div
          className="relative z-10 shrink-0 text-white/30 transition-colors duration-300 group-hover:text-gold/70"
          aria-hidden
        >
          <GripVertical size={14} strokeWidth={2.5} />
        </div>

        <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
          <Icon size={16} />
        </div>

        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              className={`min-w-0 flex-1 break-words text-sm font-medium leading-snug transition-all duration-300 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden ${
                done ? "text-white/40 line-through decoration-white/25" : ""
              } ${isTopFocus || isActiveTimeBlock || (isRunwayFocusReady && isRunwayPrimary) ? "text-gold" : ""}`}
            >
              {task.title}
            </p>
            {isRunwayFocusReady && isRunwayPrimary && !done && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                <Sparkles size={10} />
                Ready
              </span>
            )}
            {isActiveTimeBlock && !(isRunwayFocusReady && isRunwayPrimary) && !done && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">
                <Sparkles size={10} />
                Live block
              </span>
            )}
            {isFocusPaused && (
              <FocusQueueBadge variant="paused" theme="dark" />
            )}
            {isInQueue && (
              <FocusQueueBadge variant="queued" theme="dark" />
            )}
          </div>
          <p className="text-xs text-white/50">{timeLabel}</p>
        </div>

        {isRunwayFocusReady && isRunwayPrimary && slotDurationMinutes && (
          <div data-today-no-drag className="relative z-10">
            <StartFocusSessionButton
              taskId={task.id}
              durationMinutes={slotDurationMinutes}
              variant="compact"
            />
          </div>
        )}

        {(isInQueue || isFocusPaused) && onActivate && !isRunwayFocusReady && (
          <button
            type="button"
            data-today-no-drag
            onClick={onActivate}
            className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold transition hover:bg-gold/35"
            aria-label="Start focus on this task"
          >
            <Play size={14} fill="currentColor" />
          </button>
        )}

        <div data-today-no-drag className="relative z-10">
          <AnimatedTaskCheckbox
            checked={done}
            disabled={isPending}
            label={done ? "Mark incomplete" : "Mark complete"}
            onToggle={() => onToggle(task)}
          />
        </div>
      </motion.div>
    </motion.li>
  );
}

export function TodayChecklist() {
  const { tasks } = useTasks();
  const now = useCurrentClock(30000);
  const currentHour = useMemo(() => getCurrentHour(now), [now]);
  const activeBlockIds = useMemo(
    () => getActiveTimeBlockTaskIds(tasks, currentHour),
    [tasks, currentHour]
  );
  const liveBlockMeta = useMemo(() => {
    const allocations = getActiveRunwayAllocations(tasks, currentHour);
    /** @type {Map<string, { durationMinutes: number, isPrimary: boolean }>} */
    const map = new Map();
    allocations.forEach((a, i) => {
      map.set(a.task.id, {
        durationMinutes: a.durationMinutes,
        isPrimary: i === 0,
      });
    });
    return map;
  }, [tasks, currentHour]);
  const runwayPrimaryId = useMemo(() => {
    const allocations = getActiveRunwayAllocations(tasks, currentHour);
    return allocations[0]?.task.id ?? null;
  }, [tasks, currentHour]);
  const toggleComplete = useToggleTaskCompleteMutation();
  const reorderTasks = useReorderTasksMutation();
  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);
  const isTimerRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const highlightedTaskId = useTaskStore((s) => s.highlightedTaskId);
  const highlightSorting = useTaskStore((s) => s.highlightSorting);

  const { activate } = useActivateFocusTask();

  // Pin the highlighted task to the top of the display list when present
  const displayTasks = useMemo(() => {
    const base = getTodayDisplayTasks(tasks, { currentHour });
    if (!highlightedTaskId) return base;
    const idx = base.findIndex((t) => t.id === highlightedTaskId);
    if (idx <= 0) return base;
    const reordered = [...base];
    const [pinned] = reordered.splice(idx, 1);
    reordered.unshift(pinned);
    return reordered;
  }, [tasks, currentHour, highlightedTaskId]);

  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  // Slow cinematic spring for the sort-to-top move
  const HIGHLIGHT_SORT_SPRING = {
    type: "spring",
    stiffness: 55,
    damping: 14,
    mass: 1.1,
  };

  // Auto-scroll the highlighted card into view once it reaches the top
  const listRef = useRef(null);
  useEffect(() => {
    if (!highlightedTaskId || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-kanban-task-id="${highlightedTaskId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlightedTaskId]);

  const syncStatusOrder = useCallback(
    (orderedTasks, status) => {
      const taskIds = taskIdsForStatus(orderedTasks, status);
      if (taskIds.length === 0) return;
      reorderTasks.mutate({ columnId: status, taskIds });
    },
    [reorderTasks]
  );

  const handleDrop = useCallback(
    (taskId, _status, _sourceStatus, dropIndex) => {
      const task = displayTasks.find((t) => t.id === taskId);
      if (!task) return;

      const reordered = reorderDisplayList(displayTasks, taskId, dropIndex);
      syncStatusOrder(reordered, task.status);
    },
    [displayTasks, syncStatusOrder]
  );

  const { session, isDragging, draggingTaskId, startDrag, registerGhostMover } =
    useKanbanDrag({
      onDrop: handleDrop,
    });

  const handleDragStart = useCallback(
    (taskId, title, x, y) => {
      startDrag(taskId, title, x, y, TODAY_ZONE);
    },
    [startDrag]
  );

  const handleToggle = useCallback(
    (task) => {
      const nextStatus = task.status === "Completed" ? "Todo" : "Completed";
      toggleComplete.mutate({ id: task.id, nextStatus });

      if (nextStatus === "Completed") {
        const totalTasks = tasks.length;
        const nowDone = tasks.filter((t) => t.status === "Completed").length + 1;
        const pct = totalTasks > 0 ? Math.round((nowDone / totalTasks) * 100) : 0;
        if (pct >= 60) {
          velocityToast.highPerformance({ completionPct: pct });
        }
      }
    },
    [toggleComplete, tasks]
  );

  return (
    <motion.div
      layout
      className="glass-card-dark kanban-drop-zone relative flex flex-col overflow-visible p-5 md:min-h-[480px]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Today&apos;s Tasks</h3>
        <motion.span
          key={`${completedCount}-${tasks.length}`}
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          className="rounded-full bg-white/10 px-3 py-1 text-xs tabular-nums"
        >
          {completedCount}/{tasks.length}
        </motion.span>
      </div>

      <ActiveTimeBlockHero tasks={tasks} />

      <section
        data-kanban-zone={TODAY_ZONE}
        data-no-drop-highlight
        className="flex min-h-0 flex-1 flex-col overflow-visible"
      >
        <LayoutGroup id="today-checklist">
          <motion.ul
            ref={listRef}
            layout
            data-kanban-list
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-visible overflow-y-auto p-2"
            transition={KANBAN_MORPH_SPRING}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {displayTasks.length === 0 ? (
                <motion.li
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 text-center text-sm text-white/50"
                >
                  All caught up!
                </motion.li>
              ) : (
                displayTasks.map((task, i) => {
                  const isTimerTask = activeTaskId === task.id;
                  const isFocusRunning =
                    isTimerTask && isTimerRunning && task.status === "In-Progress";
                  const isFocusPaused =
                    isTimerTask && !isTimerRunning && task.status === "In-Progress";
                  const isTopFocus = isFocusRunning;
                  const isActiveTimeBlock =
                    activeBlockIds.has(task.id) && task.status !== "Completed";
                  const blockMeta = liveBlockMeta.get(task.id);
                  const isRunwayPrimary = task.id === runwayPrimaryId;
                  const isRunwayFocusReady =
                    isActiveTimeBlock &&
                    isRunwayPrimary &&
                    !(isTimerTask && isTimerRunning) &&
                    task.status !== "Completed";
                  const isInQueue =
                    task.status === "In-Progress" &&
                    !isTimerTask &&
                    !isActiveTimeBlock;

                  const isThisHighlighted = task.id === highlightedTaskId;
                  return (
                    <TodayTaskRow
                      key={task.id}
                      task={task}
                      index={i}
                      isDragging={draggingTaskId === task.id}
                      isFocusRunning={isFocusRunning}
                      isFocusPaused={isFocusPaused}
                      isInQueue={isInQueue}
                      isTopFocus={isTopFocus}
                      isActiveTimeBlock={isActiveTimeBlock}
                      isRunwayFocusReady={isRunwayFocusReady}
                      isRunwayPrimary={isRunwayPrimary}
                      isHighlighted={isThisHighlighted}
                      layoutTransition={
                        isThisHighlighted && highlightSorting
                          ? HIGHLIGHT_SORT_SPRING
                          : undefined
                      }
                      slotDurationMinutes={blockMeta?.durationMinutes}
                      onDragStart={handleDragStart}
                      onToggle={handleToggle}
                      onActivate={() =>
                        activate(
                          task.id,
                          blockMeta
                            ? buildRunwayFocusTimerOptions(blockMeta.durationMinutes)
                            : undefined
                        )
                      }
                      isPending={toggleComplete.isPending}
                    />
                  );
                })
              )}
            </AnimatePresence>
            {displayTasks.length > 0 && (
              <li
                aria-hidden
                data-kanban-drop-tail
                className="pointer-events-none min-h-6 shrink-0 list-none"
              />
            )}
          </motion.ul>
        </LayoutGroup>
      </section>

      {isDragging && session.taskTitle && (
        <KanbanDragGhost
          title={session.taskTitle}
          initialX={session.startX}
          initialY={session.startY}
          registerMover={registerGhostMover}
        />
      )}
    </motion.div>
  );
}
