"use client";

import { LayoutGroup, motion } from "framer-motion";
import {
  Compass,
  ShieldAlert,
  Users,
  Zap,
  Trash2,
} from "lucide-react";
import {
  EISENHOWER_MORPH_SPRING,
  QUADRANT_META,
} from "@/lib/eisenhower";
import { WeeklyCommitmentMeter } from "./WeeklyCommitmentMeter";
import { EisenhowerTaskCard } from "./EisenhowerTaskCard";

const ICONS = {
  Zap,
  Compass,
  Users,
  ShieldAlert,
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').EisenhowerQuadrant} props.quadrant
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {boolean} props.isHoverTarget
 * @param {string | null} props.draggingTaskId
 * @param {number} [props.weeklyProgress]
 * @param {number} [props.weeklyCount]
 * @param {number} [props.weeklyGoal]
 * @param {(taskId: string, title: string, x: number, y: number, zone: string) => void} props.onDragStart
 * @param {(taskId: string) => void} [props.onPurge]
 * @param {(taskId: string, meta: object) => void} [props.onUpdateMeta]
 * @param {Set<string>} [props.purgingIds]
 */
export function EisenhowerQuadrantPanel({
  quadrant,
  tasks,
  isHoverTarget,
  draggingTaskId,
  weeklyProgress,
  weeklyCount,
  weeklyGoal,
  onDragStart,
  onPurge,
  onUpdateMeta,
  purgingIds,
}) {
  const meta = QUADRANT_META[quadrant];
  const Icon = ICONS[/** @type {keyof typeof ICONS} */ (meta.iconName)] ?? Zap;
  const isQ1 = quadrant === 1;
  const isQ2 = quadrant === 2;
  const isQ4 = quadrant === 4;
  const isEmptyQ2 = isQ2 && tasks.length === 0;

  return (
    <motion.section
      layout={isQ1}
      data-eisenhower-zone={String(quadrant)}
      animate={{
        scale: isHoverTarget ? 1.01 : 1,
      }}
      transition={EISENHOWER_MORPH_SPRING}
      className={`eisenhower-drop-zone relative flex flex-col rounded-4xl border border-white/65 p-4 shadow-soft backdrop-blur-glass ${
        isQ1
          ? "h-auto min-h-[280px] overflow-visible"
          : "min-h-[280px] overflow-hidden"
      }`}
      style={{
        background: isHoverTarget
          ? `linear-gradient(145deg, ${meta.hoverTint}, rgba(255,255,255,0.72))`
          : undefined,
      }}
    >
      {isEmptyQ2 && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-4xl bg-gold/10"
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div
        className={`relative z-10 flex flex-col rounded-3xl bg-gradient-to-br ${meta.accent} p-1 ${
          isQ1 ? "h-auto" : "h-full min-h-0"
        }`}
      >
        <div
          className={`flex flex-col rounded-[1.35rem] border border-white/50 bg-white/45 p-3 backdrop-blur-sm ${
            isQ1
              ? "h-auto overflow-visible"
              : "min-h-0 flex-1 overflow-hidden"
          }`}
        >
          <header className="mb-3 shrink-0 flex items-start gap-2.5">
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
          </header>

          {isQ2 && weeklyProgress != null && weeklyCount != null && weeklyGoal != null && (
            <WeeklyCommitmentMeter
              progress={weeklyProgress}
              count={weeklyCount}
              goal={weeklyGoal}
            />
          )}

          <p className="mb-3 shrink-0 text-[11px] leading-relaxed text-charcoal/45">
            {meta.hint}
          </p>

          <LayoutGroup id={`eisenhower-q${quadrant}`}>
            {isQ1 ? (
              <motion.ul
                layout
                className="flex flex-col gap-3"
                transition={EISENHOWER_MORPH_SPRING}
              >
                {tasks.length === 0 ? (
                  <li className="py-6 text-center text-xs text-charcoal/35">
                    Drop tasks here
                  </li>
                ) : (
                  tasks.map((task) => (
                    <motion.li
                      key={task.id}
                      layout
                      transition={EISENHOWER_MORPH_SPRING}
                      className="relative list-none"
                    >
                      <EisenhowerTaskCard
                        task={task}
                        zone={quadrant}
                        isDragging={draggingTaskId === task.id}
                        onDragStart={onDragStart}
                        isPurging={purgingIds?.has(task.id)}
                      />
                    </motion.li>
                  ))
                )}
              </motion.ul>
            ) : (
              <div className="scrollbar-hide flex max-h-[min(420px,50vh)] min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto overscroll-contain">
                {tasks.length === 0 ? (
                  <p className="py-6 text-center text-xs text-charcoal/35">
                    Drop tasks here
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="relative shrink-0">
                      <EisenhowerTaskCard
                        task={task}
                        zone={quadrant}
                        isDragging={draggingTaskId === task.id}
                        onDragStart={onDragStart}
                        onPurge={isQ4 ? onPurge : undefined}
                        onUpdateMeta={quadrant === 3 ? onUpdateMeta : undefined}
                        isPurging={purgingIds?.has(task.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </LayoutGroup>

          {isQ4 && (
            <div
              data-eisenhower-purge="true"
              className="eisenhower-purge-well mt-3 flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-dashed border-charcoal/15 bg-charcoal/[0.03] py-2.5 text-[11px] font-medium text-charcoal/40"
            >
              <Trash2 size={14} />
              Drop here to purge
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
