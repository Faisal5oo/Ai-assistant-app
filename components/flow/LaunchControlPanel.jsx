"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Flame, Layers, Target, Zap } from "lucide-react";
import {
  FLOW_DEFAULT_MINUTES,
  FLOW_LAYOUT_TRANSITION,
  FLOW_MAX_MINUTES,
  FLOW_MIN_MINUTES,
} from "@/lib/flowConstants";
import {
  formatFlowDurationLabel,
  selectTopFlowTargets,
} from "@/lib/flowUtils";
import { BATCH_BUCKETS, buildBatchLayout } from "@/lib/batchingConstants";
import { resolveEisenhowerQuadrant } from "@/lib/eisenhower";

/**
 * Builds the selector options for the High-Intent Target Array:
 *  - Individual tasks (scored top picks)
 *  - Entire batch categories (which unpack into ordered execution cards)
 *
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {string | null} batchingFilterTag
 */
function buildTargetOptions(tasks, batchingFilterTag) {
  const active = tasks.filter((t) => t.status !== "Completed");

  // Individual task options (top scored picks)
  const topTasks = selectTopFlowTargets(tasks, batchingFilterTag);

  // Batch category options — only show buckets that have tasks assigned
  const { clusters } = buildBatchLayout(active);
  const batchOptions = BATCH_BUCKETS.filter(
    (b) => (clusters[b.id] ?? []).length > 0
  ).map((b) => ({
    type: /** @type {'batch'} */ ("batch"),
    id: `batch:${b.id}`,
    bucketId: b.id,
    label: b.title,
    taskCount: clusters[b.id].length,
    tasks: clusters[b.id],
    Icon: b.Icon,
  }));

  const taskOptions = topTasks.map((t) => ({
    type: /** @type {'task'} */ ("task"),
    id: t.id,
    task: t,
    label: t.title,
    isQ1: resolveEisenhowerQuadrant(t) === 1,
  }));

  return { taskOptions, batchOptions };
}

/**
 * Resolves a selection into { primaryTaskId, targetTaskIds, runwayQueue }.
 * Batch selections unpack all pending tasks in that category.
 *
 * @param {string} selectionId
 * @param {import('@/types/interfaces').Task[]} tasks
 * @param {{ taskOptions: ReturnType<typeof buildTargetOptions>['taskOptions'], batchOptions: ReturnType<typeof buildTargetOptions>['batchOptions'] }} options
 */
function resolveSelection(selectionId, tasks, { taskOptions, batchOptions }) {
  const active = tasks.filter((t) => t.status !== "Completed");

  if (selectionId.startsWith("batch:")) {
    const bucketId = selectionId.slice(6);
    const batchOpt = batchOptions.find((b) => b.bucketId === bucketId);
    if (!batchOpt || batchOpt.tasks.length === 0) return null;

    // Score and order tasks within batch: In-Progress first, then by priority
    const priorityScore = { High: 3, Medium: 2, Low: 1 };
    const ordered = [...batchOpt.tasks].sort((a, b) => {
      const statusDiff =
        (b.status === "In-Progress" ? 1 : 0) -
        (a.status === "In-Progress" ? 1 : 0);
      if (statusDiff !== 0) return statusDiff;
      return (priorityScore[b.priority] ?? 0) - (priorityScore[a.priority] ?? 0);
    });

    const primaryTaskId = ordered[0].id;
    const targetTaskIds = ordered.map((t) => t.id);
    return { primaryTaskId, targetTaskIds, runwayQueue: targetTaskIds };
  }

  const taskOpt = taskOptions.find((t) => t.id === selectionId);
  if (!taskOpt) return null;

  // For individual task: also include other top tasks as queue
  const otherActive = active
    .filter((t) => t.id !== selectionId && t.status !== "Completed")
    .slice(0, 4)
    .map((t) => t.id);

  return {
    primaryTaskId: selectionId,
    targetTaskIds: [selectionId, ...otherActive],
    runwayQueue: [selectionId, ...otherActive],
  };
}

/**
 * @param {Object} props
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.batchingFilterTag
 * @param {(config: { primaryTaskId: string; targetTaskIds: string[]; runwayQueue: string[]; durationMinutes: number }) => void} props.onIgnite
 */
export function LaunchControlPanel({ tasks, batchingFilterTag, onIgnite }) {
  const { taskOptions, batchOptions } = useMemo(
    () => buildTargetOptions(tasks, batchingFilterTag),
    [tasks, batchingFilterTag]
  );

  const allOptions = useMemo(
    () => [
      ...taskOptions.map((o) => ({ ...o, group: "Tasks" })),
      ...batchOptions.map((o) => ({ ...o, group: "Batches" })),
    ],
    [taskOptions, batchOptions]
  );

  const [selectedId, setSelectedId] = useState(allOptions[0]?.id ?? "");
  const [durationMinutes, setDurationMinutes] = useState(FLOW_DEFAULT_MINUTES);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    if (allOptions.length === 0) { setSelectedId(""); return; }
    if (!allOptions.some((o) => o.id === selectedId)) {
      setSelectedId(allOptions[0].id);
    }
  }, [allOptions, selectedId]);

  const selected = allOptions.find((o) => o.id === selectedId) ?? null;

  // Preview of resolved runway
  const resolved = useMemo(
    () =>
      selectedId
        ? resolveSelection(selectedId, tasks, { taskOptions, batchOptions })
        : null,
    [selectedId, tasks, taskOptions, batchOptions]
  );

  const canIgnite = Boolean(selectedId && resolved);

  const handleIgnite = () => {
    if (!canIgnite || !resolved) return;
    onIgnite({ ...resolved, durationMinutes });
  };

  const progress =
    ((durationMinutes - FLOW_MIN_MINUTES) / (FLOW_MAX_MINUTES - FLOW_MIN_MINUTES)) * 100;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -24, scale: 0.96 }}
      transition={FLOW_LAYOUT_TRANSITION}
      className="glass-card mx-auto w-full max-w-3xl border-gold/20 p-8 md:p-10"
    >
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/25 text-charcoal">
        <Zap size={22} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark/90">
        Launch Control
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-wide text-charcoal md:text-3xl">
        Calibrate Your Focus Runway
      </h2>
      <p className="mt-2 text-sm leading-relaxed tracking-wide text-charcoal/50">
        Select a task or an entire batch cluster — the engine will unpack and sequence your execution runway.
      </p>

      {/* ── High-Intent Target Array Selector ── */}
      <div className="mt-8">
        <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/40">
          High-Intent Target Array
        </label>

        {allOptions.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-charcoal/15 bg-white/40 px-4 py-6 text-center text-sm text-charcoal/45">
            No active tasks in your runway. Add tasks from the dashboard first.
          </p>
        ) : (
          <div className="relative">
            {/* Selector trigger */}
            <button
              type="button"
              onClick={() => setSelectorOpen((o) => !o)}
              className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200 ${
                selectorOpen
                  ? "border-gold/50 bg-gold/8 shadow-[0_4px_20px_rgba(234,179,8,0.12)]"
                  : "border-white/80 bg-white/55 hover:border-gold/30"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                {selected?.type === "batch" ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-charcoal">
                    <Layers size={16} />
                  </span>
                ) : (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-charcoal/8 text-charcoal/60">
                    <Target size={15} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-wide text-charcoal">
                    {selected?.label ?? "Select target…"}
                  </p>
                  {selected?.type === "batch" && (
                    <p className="text-[11px] text-charcoal/40">
                      {selected.taskCount} tasks in batch
                    </p>
                  )}
                  {selected?.type === "task" && selected.isQ1 && (
                    <p className="text-[11px] text-gold-dark">Eisenhower Q1 · Urgent & Important</p>
                  )}
                </div>
              </div>
              <ChevronDown
                size={16}
                className={`shrink-0 text-charcoal/35 transition-transform duration-200 ${
                  selectorOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown options */}
            <AnimatePresence>
              {selectorOpen && (
                <motion.div
                  key="selector-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-[0_8px_40px_rgba(26,26,26,0.12)] backdrop-blur-md"
                >
                  {/* Batch options */}
                  {batchOptions.length > 0 && (
                    <div className="px-2 pb-1 pt-2">
                      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">
                        Batch Clusters
                      </p>
                      {batchOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(opt.id);
                            setSelectorOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            selectedId === opt.id
                              ? "bg-gold/12 text-charcoal"
                              : "text-charcoal/70 hover:bg-charcoal/4"
                          }`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-charcoal">
                            <opt.Icon size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold tracking-wide">
                              {opt.label}
                            </p>
                            <p className="text-[11px] text-charcoal/40">
                              {opt.taskCount} pending task{opt.taskCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                          {selectedId === opt.id && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Task options */}
                  {taskOptions.length > 0 && (
                    <div className={`px-2 pb-2 ${batchOptions.length > 0 ? "border-t border-charcoal/8 pt-1" : "pt-2"}`}>
                      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">
                        Individual Tasks
                      </p>
                      {taskOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSelectedId(opt.id);
                            setSelectorOpen(false);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                            selectedId === opt.id
                              ? "bg-gold/12 text-charcoal"
                              : "text-charcoal/70 hover:bg-charcoal/4"
                          }`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-charcoal/6 text-charcoal/55">
                            <Target size={14} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold tracking-wide">
                              {opt.task.title}
                            </p>
                            <p className="text-[11px] text-charcoal/40">
                              {opt.task.status} · {opt.task.priority} priority
                              {opt.isQ1 ? " · Q1" : ""}
                            </p>
                          </div>
                          {selectedId === opt.id && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Runway preview ── */}
      <AnimatePresence>
        {resolved && resolved.runwayQueue.length > 1 && (
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28 }}
            className="mt-5 overflow-hidden"
          >
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-charcoal/35">
              Execution Runway Preview
            </p>
            <div className="flex flex-col gap-1.5">
              {resolved.runwayQueue.slice(0, 5).map((taskId, index) => {
                const t = tasks.find((x) => x.id === taskId);
                if (!t) return null;
                return (
                  <motion.div
                    key={taskId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${
                      index === 0
                        ? "border border-gold/30 bg-gold/8"
                        : "border border-charcoal/6 bg-white/50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                        index === 0 ? "bg-gold/25 text-charcoal" : "bg-charcoal/8 text-charcoal/40"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <p className={`line-clamp-1 text-xs font-medium ${index === 0 ? "text-charcoal" : "text-charcoal/55"}`}>
                      {t.title}
                    </p>
                  </motion.div>
                );
              })}
              {resolved.runwayQueue.length > 5 && (
                <p className="pl-2 text-[10px] text-charcoal/30">
                  +{resolved.runwayQueue.length - 5} more task{resolved.runwayQueue.length - 5 !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Focus Duration slider ── */}
      <div className="mt-10">
        <div className="mb-3 flex items-end justify-between">
          <label className="text-xs font-semibold uppercase tracking-[0.22em] text-charcoal/40">
            Focus Duration
          </label>
          <span className="font-display text-lg font-semibold tabular-nums tracking-wide text-gold-dark">
            {formatFlowDurationLabel(durationMinutes)}
          </span>
        </div>
        <div className="relative pt-1">
          <input
            type="range"
            min={FLOW_MIN_MINUTES}
            max={FLOW_MAX_MINUTES}
            step={5}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="flow-golden-slider h-2 w-full cursor-pointer appearance-none rounded-full bg-charcoal/8"
            style={{
              background: `linear-gradient(to right, #EAB308 0%, #FACC15 ${progress}%, rgba(26,26,26,0.08) ${progress}%, rgba(26,26,26,0.08) 100%)`,
            }}
            aria-label="Focus duration in minutes"
          />
          <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-widest text-charcoal/35">
            <span>{FLOW_MIN_MINUTES}m</span>
            <span>{FLOW_MAX_MINUTES}m</span>
          </div>
        </div>
      </div>

      {/* ── Ignite CTA ── */}
      <motion.button
        type="button"
        disabled={!canIgnite}
        onClick={handleIgnite}
        whileHover={canIgnite ? { scale: 1.01 } : undefined}
        whileTap={canIgnite ? { scale: 0.99 } : undefined}
        transition={FLOW_LAYOUT_TRANSITION}
        className="pill-btn-gold mt-10 flex w-full items-center justify-center gap-2 py-4 text-base font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Flame size={18} />
        Ignite Flow
      </motion.button>
    </motion.div>
  );
}
