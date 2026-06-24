"use client";

import { useState } from "react";
import { LayoutGroup, motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { KANBAN_MORPH_SPRING } from "@/lib/kanban";

const ARCHIVE_SPRING = {
  type: "spring",
  stiffness: 280,
  damping: 32,
  mass: 0.85,
};

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.todayTasks
 * @param {import('@/types/interfaces').Task[]} props.archivedTasks
 * @param {boolean} props.archivedLoading
 * @param {(task: import('@/types/interfaces').Task) => React.ReactNode} props.renderTask
 */
export function CompletedColumnSections({
  todayTasks,
  archivedTasks,
  archivedLoading,
  renderTask,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const archivedCount = archivedTasks.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
            Today
          </p>
          <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-charcoal/55">
            {todayTasks.length}
          </span>
        </div>

        {todayTasks.length === 0 ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-charcoal/10 px-4 text-center text-xs text-charcoal/35">
            Nothing completed yet today
          </div>
        ) : (
          <LayoutGroup id="kanban-completed-today">
            <ul className="flex flex-col gap-3 overflow-visible p-0.5">
              {todayTasks.map((task) => (
                <li key={task.id} className="list-none overflow-visible">
                  {renderTask(task)}
                </li>
              ))}
            </ul>
          </LayoutGroup>
        )}
      </section>

      {(archivedCount > 0 || archivedLoading) && (
        <section className="mt-auto border-t border-charcoal/8 pt-3">
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            className="group flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-white/35"
            aria-expanded={historyOpen}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/45">
                Archived History
              </p>
              <p className="mt-0.5 text-xs text-charcoal/55 transition-colors group-hover:text-charcoal/70">
                {historyOpen ? "Hide past completions" : "Show past completions"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {archivedLoading ? (
                <span className="inline-block h-4 w-8 animate-pulse rounded-full bg-charcoal/10" />
              ) : (
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-charcoal/60 shadow-glass">
                  {archivedCount}
                </span>
              )}
              <motion.span
                animate={{ rotate: historyOpen ? 180 : 0 }}
                transition={ARCHIVE_SPRING}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/75 text-charcoal/55 shadow-glass"
              >
                <ChevronDown size={15} strokeWidth={2.25} />
              </motion.span>
            </div>
          </button>

          <AnimatePresence initial={false}>
            {historyOpen && (
              <motion.div
                key="completed-archive-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={ARCHIVE_SPRING}
                className="overflow-hidden"
              >
                <LayoutGroup id="kanban-completed-archive">
                  <motion.ul
                    layout
                    className="flex flex-col gap-3 overflow-visible pb-1 pt-3"
                    transition={KANBAN_MORPH_SPRING}
                  >
                    {archivedTasks.map((task) => (
                      <motion.li
                        key={task.id}
                        layout
                        layoutId={`archive-${task.id}`}
                        className="list-none overflow-visible opacity-90"
                        transition={KANBAN_MORPH_SPRING}
                      >
                        {renderTask(task, { archived: true })}
                      </motion.li>
                    ))}
                  </motion.ul>
                </LayoutGroup>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
