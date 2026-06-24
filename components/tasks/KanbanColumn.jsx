"use client";

import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useActivateFocusTask } from "@/hooks/useActivateFocusTask";
import { useTaskStore } from "@/store/useTaskStore";
import { COLUMN_META, KANBAN_DROP_SPRING, KANBAN_MORPH_SPRING } from "@/lib/kanban";
import { TaskCard } from "./TaskCard";
import { CompletedColumnSections } from "./CompletedColumnSections";
import { useEffect, useRef, useMemo, useCallback } from "react";

const ICONS = {
  Circle,
  Clock3,
  CheckCircle2,
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').TaskStatus} props.status
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {boolean} props.isHoverTarget
 * @param {string | null} props.draggingTaskId
 * @param {(taskId: string, title: string, x: number, y: number, status: string) => void} props.onDragStart
 * @param {(task: import('@/types/interfaces').Task) => void} props.onEdit
 * @param {(taskId: string) => void} props.onDelete
 * @param {import('@/types/interfaces').Task[]} [props.archivedTasks]
 * @param {boolean} [props.archivedLoading]
 */
/** Slow cinematic spring used only for the highlight sort-to-top move */
const HIGHLIGHT_SORT_SPRING = {
  type: "spring",
  stiffness: 55,
  damping: 14,
  mass: 1.1,
};

export function KanbanColumn({
  status,
  tasks,
  isHoverTarget,
  draggingTaskId,
  onDragStart,
  onEdit,
  onDelete,
  archivedTasks = [],
  archivedLoading = false,
}) {
  const meta = COLUMN_META[status];
  const Icon = ICONS[/** @type {keyof typeof ICONS} */ (meta.iconName)] ?? Circle;
  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);
  const isTimerRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const highlightedTaskId = useTaskStore((s) => s.highlightedTaskId);
  const highlightSorting = useTaskStore((s) => s.highlightSorting);
  const { activate } = useActivateFocusTask();

  // Pin the highlighted task to the top of this column's list
  const orderedTasks = useMemo(() => {
    if (!highlightedTaskId) return tasks;
    const idx = tasks.findIndex((t) => t.id === highlightedTaskId);
    if (idx <= 0) return tasks;
    const reordered = [...tasks];
    const [pinned] = reordered.splice(idx, 1);
    reordered.unshift(pinned);
    return reordered;
  }, [tasks, highlightedTaskId]);

  // Scroll the highlighted card into view once it reaches the top
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

  const renderTaskCard = useCallback(
    (task, options = {}) => {
      const { archived = false } = options;
      const isOptimistic = task.id.startsWith("temp-");
      const isTimerTask = !isOptimistic && activeTaskId === task.id;
      const isFocusRunning =
        isTimerTask && isTimerRunning && task.status === "In-Progress";
      const isFocusPaused =
        isTimerTask && !isTimerRunning && task.status === "In-Progress";
      const isInQueue =
        !isOptimistic && status === "In-Progress" && !isTimerTask;
      const isHighlighted = !isOptimistic && task.id === highlightedTaskId;

      return (
        <motion.div
          layout={!archived}
          layoutId={archived ? undefined : task.id}
          data-kanban-task-id={task.id}
          transition={
            isHighlighted && highlightSorting
              ? HIGHLIGHT_SORT_SPRING
              : KANBAN_MORPH_SPRING
          }
          className="relative overflow-visible"
        >
          <TaskCard
            task={task}
            status={status}
            isDragging={draggingTaskId === task.id}
            isFocusRunning={isFocusRunning}
            isFocusPaused={isFocusPaused}
            isInQueue={isInQueue}
            isHighlighted={isHighlighted}
            onActivate={() => activate(task.id)}
            onDragStart={onDragStart}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
            dragDisabled={archived}
          />
        </motion.div>
      );
    },
    [
      activeTaskId,
      activate,
      draggingTaskId,
      highlightSorting,
      highlightedTaskId,
      isTimerRunning,
      onDelete,
      onDragStart,
      onEdit,
      status,
    ]
  );

  const isCompletedColumn = status === "Completed";
  const displayCount = isCompletedColumn
    ? orderedTasks.length + archivedTasks.length
    : orderedTasks.length;

  return (
    <section
      data-kanban-zone={status}
      data-no-drop-highlight
      className="kanban-drop-zone relative flex min-h-[220px] flex-col overflow-visible rounded-4xl border border-white/65 p-3 shadow-soft backdrop-blur-glass sm:min-h-[280px] sm:p-4 md:min-h-[420px]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-4xl will-change-transform"
        initial={false}
        animate={{
          opacity: isHoverTarget ? 1 : 0,
          scale: isHoverTarget ? 1 : 0.985,
        }}
        transition={KANBAN_DROP_SPRING}
        style={{
          background: `linear-gradient(145deg, ${meta.hoverTint}, rgba(255,255,255,0.72))`,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-4xl will-change-transform"
        initial={false}
        animate={{ opacity: isHoverTarget ? 1 : 0 }}
        transition={KANBAN_DROP_SPRING}
        style={{
          boxShadow: `0 0 0 2px ${meta.glowRing}, 0 16px 48px ${meta.glowShadow}`,
        }}
      />

      <div
        className={`relative z-10 flex flex-1 flex-col rounded-3xl bg-gradient-to-br ${meta.accent} p-1`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-visible rounded-[1.35rem] border border-white/50 bg-white/45 p-3 backdrop-blur-sm">
          <header className="mb-3 flex shrink-0 items-start gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-charcoal shadow-glass">
              <Icon size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-sm font-semibold tracking-tight text-charcoal">
                {meta.title}
              </h3>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-charcoal/40">
                {meta.subtitle}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-charcoal/70 shadow-glass">
              {displayCount}
            </span>
          </header>

          <p className="mb-3 shrink-0 text-[11px] leading-relaxed text-charcoal/45">
            {meta.hint}
          </p>

          <LayoutGroup id={`kanban-${status}`}>
            {isCompletedColumn ? (
              <div ref={listRef} data-kanban-list className="flex min-h-0 flex-1 flex-col overflow-visible p-1">
                <CompletedColumnSections
                  todayTasks={orderedTasks}
                  archivedTasks={archivedTasks}
                  archivedLoading={archivedLoading}
                  renderTask={renderTaskCard}
                />
                <div
                  aria-hidden
                  data-kanban-drop-tail
                  className="pointer-events-none min-h-6 shrink-0"
                />
              </div>
            ) : (
              <motion.ul
                ref={listRef}
                layout
                data-kanban-list
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-visible p-1"
                transition={KANBAN_MORPH_SPRING}
              >
                {orderedTasks.length === 0 ? (
                  <li className="flex min-h-[140px] flex-1 list-none flex-col sm:min-h-[200px] md:min-h-[280px]">
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-charcoal/10 px-4 text-center text-xs text-charcoal/35">
                      Drop tasks here
                    </div>
                  </li>
                ) : (
                  orderedTasks.map((task) => (
                    <motion.li
                      key={task.id}
                      layout
                      layoutId={task.id}
                      data-kanban-task-id={task.id}
                      transition={
                        task.id === highlightedTaskId && highlightSorting
                          ? HIGHLIGHT_SORT_SPRING
                          : KANBAN_MORPH_SPRING
                      }
                      className="relative list-none overflow-visible"
                    >
                      {renderTaskCard(task)}
                    </motion.li>
                  ))
                )}
                <li
                  aria-hidden
                  data-kanban-drop-tail
                  className="pointer-events-none min-h-6 shrink-0 list-none"
                />
              </motion.ul>
            )}
          </LayoutGroup>
        </div>
      </div>
    </section>
  );
}
