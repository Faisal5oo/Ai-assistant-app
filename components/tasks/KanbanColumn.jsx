"use client";

import { LayoutGroup, motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { useActivateFocusTask } from "@/hooks/useActivateFocusTask";
import { useTaskStore } from "@/store/useTaskStore";
import { COLUMN_META, KANBAN_DROP_SPRING, KANBAN_MORPH_SPRING } from "@/lib/kanban";
import { TaskCard } from "./TaskCard";

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
 */
export function KanbanColumn({
  status,
  tasks,
  isHoverTarget,
  draggingTaskId,
  onDragStart,
  onEdit,
  onDelete,
}) {
  const meta = COLUMN_META[status];
  const Icon = ICONS[/** @type {keyof typeof ICONS} */ (meta.iconName)] ?? Circle;
  const activeTaskId = useTaskStore((s) => s.activeTimer.taskId);
  const isTimerRunning = useTaskStore((s) => s.activeTimer.isRunning);
  const { activate } = useActivateFocusTask();

  return (
    <section
      data-kanban-zone={status}
      data-no-drop-highlight
      className="kanban-drop-zone relative flex min-h-[420px] flex-col overflow-visible rounded-4xl border border-white/65 p-4 shadow-soft backdrop-blur-glass"
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
              {tasks.length}
            </span>
          </header>

          <p className="mb-3 shrink-0 text-[11px] leading-relaxed text-charcoal/45">
            {meta.hint}
          </p>

          <LayoutGroup id={`kanban-${status}`}>
            <motion.ul
              layout
              data-kanban-list
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-visible p-1"
              transition={KANBAN_MORPH_SPRING}
            >
              {tasks.length === 0 ? (
                <li className="flex min-h-[280px] flex-1 list-none flex-col">
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-charcoal/10 px-4 text-center text-xs text-charcoal/35">
                    Drop tasks here
                  </div>
                </li>
              ) : (
                tasks.map((task) => {
                  const isTimerTask = activeTaskId === task.id;
                  const isFocusRunning =
                    isTimerTask &&
                    isTimerRunning &&
                    task.status === "In-Progress";
                  const isFocusPaused =
                    isTimerTask &&
                    !isTimerRunning &&
                    task.status === "In-Progress";
                  const isInQueue =
                    status === "In-Progress" && !isTimerTask;

                  return (
                    <motion.li
                      key={task.id}
                      layout
                      data-kanban-task-id={task.id}
                      transition={KANBAN_MORPH_SPRING}
                      className="relative list-none overflow-visible"
                    >
                      <TaskCard
                        task={task}
                        status={status}
                        isDragging={draggingTaskId === task.id}
                        isFocusRunning={isFocusRunning}
                        isFocusPaused={isFocusPaused}
                        isInQueue={isInQueue}
                        onActivate={() => activate(task.id)}
                        onDragStart={onDragStart}
                        onEdit={() => onEdit(task)}
                        onDelete={() => onDelete(task.id)}
                      />
                    </motion.li>
                  );
                })
              )}
              <li
                aria-hidden
                data-kanban-drop-tail
                className="pointer-events-none min-h-6 shrink-0 list-none"
              />
            </motion.ul>
          </LayoutGroup>
        </div>
      </div>
    </section>
  );
}
