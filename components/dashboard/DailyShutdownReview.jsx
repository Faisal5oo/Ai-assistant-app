"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  CheckCircle2,
  Clock,
  SkipForward,
  CalendarArrowUp,
  Loader2,
  Moon,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { appToast } from "@/lib/toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayBoundaries() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function isTodayTask(task) {
  const { start, end } = todayBoundaries();

  if (task.scheduledAt) {
    const d = new Date(task.scheduledAt);
    return d >= start && d <= end;
  }

  // Fall back: tasks updated or created today that are not Completed
  if (task.updatedAt) {
    const u = new Date(task.updatedAt);
    return u >= start && u <= end;
  }

  const c = new Date(task.createdAt);
  return c >= start && c <= end;
}

function formatTime(ms) {
  if (!ms) return null;
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

// ─── Priority badge ───────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const styles =
    priority === "High"
      ? "bg-red-500/15 text-red-400 border-red-500/20"
      : priority === "Medium"
      ? "bg-amber-400/15 text-amber-400 border-amber-400/20"
      : "bg-white/5 text-white/40 border-white/10";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles}`}
    >
      {priority}
    </span>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────
function TaskRow({ task, variant }) {
  const isCompleted = variant === "completed";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        isCompleted
          ? "bg-emerald-500/5 border border-emerald-500/10"
          : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
      }`}
    >
      <div className="shrink-0">
        {isCompleted ? (
          <CheckCircle2 size={15} className="text-emerald-400" />
        ) : (
          <Clock size={15} className="text-white/30" />
        )}
      </div>
      <p
        className={`flex-1 text-sm font-medium leading-snug min-w-0 truncate ${
          isCompleted ? "text-white/50 line-through" : "text-white/80"
        }`}
      >
        {task.title}
      </p>
      <div className="flex items-center gap-2 shrink-0">
        {task.actualTimeSpent > 0 && (
          <span className="text-[10px] text-white/30 font-mono">
            {formatTime(task.actualTimeSpent)}
          </span>
        )}
        <PriorityBadge priority={task.priority} />
      </div>
    </div>
  );
}

// ─── Overlay variants ─────────────────────────────────────────────────────────
const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const MODAL_VARIANTS = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 28 },
  },
  exit: {
    opacity: 0,
    y: 16,
    scale: 0.97,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

// ─── Main modal ───────────────────────────────────────────────────────────────

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export function DailyShutdownReview({ open, onClose }) {
  const { tasks } = useTasks();
  const queryClient = useQueryClient();
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);

  // Partition tasks for today
  const { completed, remaining } = useMemo(() => {
    const todayTasks = tasks.filter(isTodayTask);
    return {
      completed: todayTasks.filter((t) => t.status === "Completed"),
      remaining: todayTasks.filter(
        (t) => t.status === "Todo" || t.status === "In-Progress"
      ),
    };
  }, [tasks]);

  const totalToday = completed.length + remaining.length;
  const completionPct =
    totalToday > 0 ? Math.round((completed.length / totalToday) * 100) : 0;

  const handleMigrate = useCallback(async () => {
    if (migrating || migrated || remaining.length === 0) return;

    const ids = remaining.map((t) => t.id);
    setMigrating(true);

    try {
      const res = await fetch("/api/tasks/migrate-tomorrow", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIds: ids }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error ?? "Migration failed.");
      }

      // Optimistically patch the TanStack Query cache
      queryClient.setQueryData(queryKeys.tasks("today"), (prev) => {
        if (!prev) return prev;
        const updatedMap = new Map(data.tasks.map((t) => [t.id, t]));
        return prev.map((t) => updatedMap.get(t.id) ?? t);
      });

      setMigrated(true);
      appToast.success(
        `${data.migratedCount} task${data.migratedCount !== 1 ? "s" : ""} moved to tomorrow.`
      );

      setTimeout(() => onClose(), 1800);
    } catch (err) {
      appToast.error(err, "Could not migrate tasks.");
    } finally {
      setMigrating(false);
    }
  }, [migrating, migrated, remaining, queryClient, onClose]);

  const handleClose = useCallback(() => {
    if (!migrating) onClose();
  }, [migrating, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="shutdown-overlay"
          variants={OVERLAY_VARIANTS}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            key="shutdown-modal"
            variants={MODAL_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Daily Shutdown Review"
          >
            <div className="rounded-2xl border border-white/10 bg-charcoal overflow-hidden shadow-[0_32px_96px_rgba(0,0,0,0.7)]">
              {/* ── Header ──────────────────────────────────────────────── */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.07]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20">
                  <Moon size={18} className="text-indigo-300" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white tracking-wide">
                    Daily Shutdown Review
                  </h2>
                  <p className="text-xs text-white/35 mt-0.5">
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={migrating}
                  className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition disabled:opacity-40"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* ── Progress summary ─────────────────────────────────────── */}
              <div className="px-6 pt-5 pb-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white/50">
                        Day completion
                      </span>
                      <span className="text-xs font-bold text-white/80 font-mono">
                        {completionPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <TrendingUp
                    size={16}
                    className={
                      completionPct >= 70
                        ? "text-emerald-400"
                        : "text-white/25"
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/15 p-3">
                    <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest font-semibold mb-1">
                      Completed Today
                    </p>
                    <p className="text-2xl font-bold text-emerald-400 font-mono leading-none">
                      {completed.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-400/8 border border-amber-400/15 p-3">
                    <p className="text-[10px] text-amber-400/70 uppercase tracking-widest font-semibold mb-1">
                      Remaining / Skipped
                    </p>
                    <p className="text-2xl font-bold text-amber-400 font-mono leading-none">
                      {remaining.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Split panels ─────────────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-white/[0.07]">
                {/* Completed column */}
                <div className="px-5 py-4 border-b sm:border-b-0 sm:border-r border-white/[0.07]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/70 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={11} />
                    Done
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {completed.length === 0 ? (
                      <p className="text-xs text-white/20 italic py-2">
                        No completed tasks today.
                      </p>
                    ) : (
                      completed.map((t) => (
                        <TaskRow key={t.id} task={t} variant="completed" />
                      ))
                    )}
                  </div>
                </div>

                {/* Remaining column */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70 mb-3 flex items-center gap-1.5">
                    <SkipForward size={11} />
                    Remaining
                  </p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {remaining.length === 0 ? (
                      <p className="text-xs text-white/20 italic py-2">
                        All tasks cleared. Clean runway!
                      </p>
                    ) : (
                      remaining.map((t) => (
                        <TaskRow key={t.id} task={t} variant="remaining" />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer action ────────────────────────────────────────── */}
              <div className="px-6 py-4 border-t border-white/[0.07] flex items-center gap-3">
                {remaining.length > 0 && !migrated && (
                  <div className="flex items-center gap-2 text-xs text-amber-400/60">
                    <AlertTriangle size={12} />
                    <span>
                      {remaining.length} unfinished task
                      {remaining.length !== 1 ? "s" : ""} will carry
                      today&apos;s date.
                    </span>
                  </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={migrating}
                    className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/50 hover:text-white/80 hover:border-white/20 transition disabled:opacity-40"
                  >
                    Close Review
                  </button>

                  {remaining.length > 0 && (
                    <button
                      type="button"
                      onClick={handleMigrate}
                      disabled={migrating || migrated}
                      className="flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition"
                    >
                      {migrating ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          Migrating…
                        </>
                      ) : migrated ? (
                        <>
                          <CheckCircle2 size={13} />
                          Migrated!
                        </>
                      ) : (
                        <>
                          <CalendarArrowUp size={13} />
                          Migrate Unfinished to Tomorrow
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
