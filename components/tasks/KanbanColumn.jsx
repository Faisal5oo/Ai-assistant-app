"use client";

import { LayoutGroup, motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import { COLUMN_META, KANBAN_MORPH_SPRING } from "@/lib/kanban";
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

  return (
    <motion.section
      data-kanban-zone={status}
      animate={{ scale: isHoverTarget ? 1.01 : 1 }}
      transition={KANBAN_MORPH_SPRING}
      className="kanban-drop-zone relative flex min-h-[420px] flex-col overflow-visible rounded-4xl border border-white/65 p-4 shadow-soft backdrop-blur-glass"
      style={{
        background: isHoverTarget
          ? `linear-gradient(145deg, ${meta.hoverTint}, rgba(255,255,255,0.72))`
          : undefined,
      }}
    >
      <div
        className={`flex flex-1 flex-col rounded-3xl bg-gradient-to-br ${meta.accent} p-1`}
      >
        <div className="flex flex-col overflow-visible rounded-[1.35rem] border border-white/50 bg-white/45 p-3 backdrop-blur-sm">
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
              className="flex flex-col gap-3"
              transition={KANBAN_MORPH_SPRING}
            >
              {tasks.length === 0 ? (
                <li className="py-10 text-center text-xs text-charcoal/35">
                  Drop tasks here
                </li>
              ) : (
                tasks.map((task) => (
                  <motion.li
                    key={task.id}
                    layout
                    data-kanban-task-id={task.id}
                    transition={KANBAN_MORPH_SPRING}
                    className="relative list-none"
                  >
                    <TaskCard
                      task={task}
                      status={status}
                      isDragging={draggingTaskId === task.id}
                      onDragStart={onDragStart}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task.id)}
                    />
                  </motion.li>
                ))
              )}
            </motion.ul>
          </LayoutGroup>
        </div>
      </div>
    </motion.section>
  );
}
