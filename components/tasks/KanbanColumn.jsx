"use client";

import { LayoutGroup, motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import {
  buildColumnDisplayTasks,
  KANBAN_PLACEHOLDER,
} from "@/lib/kanbanDragUtils";
import { COLUMN_META } from "@/lib/kanban";
import { TaskCard } from "./TaskCard";

const ICONS = {
  Circle,
  Clock3,
  CheckCircle2,
};

const LIST_LAYOUT_TRANSITION = {
  layout: { type: "spring", stiffness: 500, damping: 40, mass: 0.8 },
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').TaskStatus} props.status
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {boolean} props.isHoverTarget
 * @param {string | null} props.draggingTaskId
 * @param {string | null} props.sourceStatus
 * @param {number} props.sourceIndex
 * @param {{ status: string | null; index: number | null }} props.hoverInsert
 * @param {(taskId: string, title: string, x: number, y: number, status: string) => void} props.onDragStart
 * @param {(task: import('@/types/interfaces').Task) => void} props.onEdit
 * @param {(taskId: string) => void} props.onDelete
 */
export function KanbanColumn({
  status,
  tasks,
  isHoverTarget,
  draggingTaskId,
  sourceStatus,
  sourceIndex,
  hoverInsert,
  onDragStart,
  onEdit,
  onDelete,
}) {
  const meta = COLUMN_META[status];
  const Icon = ICONS[/** @type {keyof typeof ICONS} */ (meta.iconName)] ?? Circle;

  const isDragging = Boolean(draggingTaskId);
  const displayTasks = buildColumnDisplayTasks(
    tasks,
    status,
    draggingTaskId,
    sourceStatus,
    sourceIndex,
    hoverInsert.status,
    hoverInsert.index
  );

  const animateListLayout =
    isDragging &&
    (status === hoverInsert.status || status === sourceStatus);

  return (
    <section
      data-kanban-zone={status}
      className={`kanban-drop-zone relative flex min-h-[420px] flex-col rounded-4xl border p-4 shadow-soft backdrop-blur-glass transition-[box-shadow,border-color] duration-200 ${
        isHoverTarget
          ? "border-gold/45 ring-2 ring-gold/30"
          : "border-white/65"
      }`}
    >
      <div
        className={`flex flex-1 flex-col rounded-3xl bg-gradient-to-br ${meta.accent} p-1`}
      >
        <div className="flex flex-col rounded-[1.35rem] border border-white/50 bg-white/45 p-3 backdrop-blur-sm">
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
            <ul data-kanban-list className="flex flex-col gap-3">
              {displayTasks.length === 0 ? (
                <li className="py-10 text-center text-xs text-charcoal/35">
                  Drop tasks here
                </li>
              ) : (
                displayTasks.map((task) => {
                  if (task.id === KANBAN_PLACEHOLDER.id) {
                    return (
                      <motion.li
                        key={KANBAN_PLACEHOLDER.id}
                        layout={animateListLayout ? "position" : false}
                        transition={LIST_LAYOUT_TRANSITION}
                        className="relative list-none"
                        aria-hidden
                      >
                        <div className="min-h-[5.5rem] rounded-2xl border border-dashed border-gold/35 bg-gold/[0.08]" />
                      </motion.li>
                    );
                  }

                  return (
                    <motion.li
                      key={task.id}
                      layout={animateListLayout ? "position" : false}
                      data-kanban-task-id={task.id}
                      transition={LIST_LAYOUT_TRANSITION}
                      className="relative list-none"
                    >
                      <TaskCard
                        task={task}
                        status={status}
                        isDragging={false}
                        onDragStart={onDragStart}
                        onEdit={() => onEdit(task)}
                        onDelete={() => onDelete(task.id)}
                      />
                    </motion.li>
                  );
                })
              )}
            </ul>
          </LayoutGroup>
        </div>
      </div>
    </section>
  );
}
