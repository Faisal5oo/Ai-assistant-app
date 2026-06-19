"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { useDashboard } from "@/hooks/queries/useDashboardQuery";
import { useTaskStore } from "@/store/useTaskStore";
import {
  formatScheduledTime,
  getHourFromIso,
  isScheduledToday,
  todayKey,
} from "@/lib/utils";

/** Operational day: 8 AM – 8 PM */
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
/** Height of each 1-hour row in the grid canvas, in px */
const HOUR_HEIGHT = 56;
/** Width reserved for the time-label gutter (must be fixed so grid lines align) */
const GUTTER_W = 72; // px — wide enough for "12:00 pm"

const HOUR_SLOTS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => DAY_START_HOUR + i
);
const TOTAL_HEIGHT = HOUR_SLOTS.length * HOUR_HEIGHT;

/** "1:00 pm" / "8:00 am" */
function formatHourLabel(h) {
  const suffix = h < 12 ? "am" : "pm";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${suffix}`;
}

/** Hour (possibly fractional) → pixel offset from the top of the canvas */
function hourToPx(h) {
  return Math.max(0, (h - DAY_START_HOUR) * HOUR_HEIGHT);
}

/**
 * Merge timeBlockAllocations + scheduledAt into a sorted block list for today.
 * Allocation entries take priority over scheduledAt for the same taskId+hour.
 */
function buildTimelineBlocks(tasks, dateKey) {
  /** @type {Map<string, object>} */
  const blockMap = new Map();

  for (const task of tasks) {
    if (task.status === "Completed") continue;

    for (const alloc of task.timeBlockAllocations ?? []) {
      if (alloc.date !== dateKey) continue;
      if (alloc.hour < DAY_START_HOUR || alloc.hour >= DAY_END_HOUR) continue;
      const key = `${task.id}-${alloc.hour}`;
      if (!blockMap.has(key)) {
        blockMap.set(key, {
          id: `${task.id}-blk-${alloc.hour}`,
          taskId: task.id,
          title: task.title,
          hour: alloc.hour,
          durationMinutes: alloc.durationMinutes,
          priority: task.priority,
          category: task.category,
          source: "block",
        });
      }
    }

    if (task.scheduledAt && isScheduledToday(task.scheduledAt)) {
      const rawHour = getHourFromIso(task.scheduledAt);
      const slotHour = Math.floor(rawHour);
      if (slotHour < DAY_START_HOUR || slotHour >= DAY_END_HOUR) continue;
      const key = `${task.id}-${slotHour}`;
      if (!blockMap.has(key)) {
        blockMap.set(key, {
          id: `${task.id}-scd-${slotHour}`,
          taskId: task.id,
          title: task.title,
          hour: rawHour,
          durationMinutes: undefined,
          priority: task.priority,
          category: task.category,
          source: "scheduled",
          scheduledAt: task.scheduledAt,
        });
      }
    }
  }

  return Array.from(blockMap.values()).sort((a, b) => a.hour - b.hour);
}

export function TimelineCalendar() {
  const router = useRouter();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { activeTimeBlock } = useDashboard();
  const setHighlightedTaskId = useTaskStore((s) => s.setHighlightedTaskId);

  const dateKey = todayKey();
  const monthLabel = format(new Date(), "MMMM yyyy");

  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const nowInRange = currentHour >= DAY_START_HOUR && currentHour < DAY_END_HOUR;
  const nowOffsetPx = nowInRange ? hourToPx(currentHour) : null;

  const todayBlocks = useMemo(
    () => buildTimelineBlocks(tasks, dateKey),
    [tasks, dateKey]
  );

  // Auto-scroll to the current-hour row on first mount
  const scrollRef = useRef(null);
  useEffect(() => {
    if (!scrollRef.current || nowOffsetPx === null) return;
    scrollRef.current.scrollTop = Math.max(0, nowOffsetPx - HOUR_HEIGHT * 1.5);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  const handleBlockClick = useCallback(
    (taskId) => {
      setHighlightedTaskId(taskId);
      router.push(`/tasks?highlight=${taskId}`);
    },
    [router, setHighlightedTaskId]
  );

  return (
    <motion.div layout className="glass-card col-span-full p-6 lg:col-span-2">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{monthLabel}</h3>
        <div className="flex gap-4 text-xs text-charcoal/50">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
            <span
              key={d}
              className={
                d === format(new Date(), "EEE") ? "font-semibold text-charcoal" : ""
              }
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: HOUR_HEIGHT * 6 }}
      >
        {/*
          Layout: a single full-width row that holds the gutter + canvas
          side-by-side. We use a relative wrapper so the "now" needle and
          divider lines can be absolutely positioned spanning both columns.
        */}
        <div className="relative flex">
          {/* ── Gutter: hour labels ──────────────────────────────────────────
              Each label is positioned at the EXACT pixel offset of its divider
              line using `absolute` + `top`, then pulled up by half its own
              line-height so the text is vertically centered ON the line.
          */}
          <div
            className="relative shrink-0"
            style={{ width: GUTTER_W, height: TOTAL_HEIGHT }}
          >
            {HOUR_SLOTS.map((h, i) => (
              <div
                key={h}
                className="absolute right-3 translate-y-[-50%] text-[11px] leading-none text-charcoal/40"
                style={{ top: i * HOUR_HEIGHT }}
              >
                {formatHourLabel(h)}
              </div>
            ))}
          </div>

          {/* ── Canvas: grid lines + task pills ─────────────────────────────── */}
          <div
            className="relative flex-1 rounded-2xl bg-white/30"
            style={{ height: TOTAL_HEIGHT }}
          >
            {/* Hour divider lines — positioned at the same top as gutter labels */}
            {HOUR_SLOTS.map((h, i) => (
              <div
                key={h}
                className={`absolute left-0 right-0 border-t ${
                  nowInRange && h === Math.floor(currentHour)
                    ? "border-gold/25"
                    : "border-charcoal/6"
                }`}
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

            {/* Empty-slot ghost rows */}
            {!tasksLoading &&
              HOUR_SLOTS.map((h, i) => {
                const hasBlock = todayBlocks.some(
                  (b) => Math.floor(b.hour) === h
                );
                return !hasBlock ? (
                  <div
                    key={`ghost-${h}`}
                    className="absolute left-2 right-2 rounded-xl border border-dashed border-charcoal/[0.07] transition-colors hover:border-charcoal/20"
                    style={{ top: i * HOUR_HEIGHT + 5, height: HOUR_HEIGHT - 10 }}
                  />
                ) : null;
              })}

            {/* "Now" needle */}
            {nowOffsetPx !== null && (
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
                style={{ top: nowOffsetPx }}
              >
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold shadow-[0_0_7px_rgba(250,204,21,0.9)]" />
                <div className="h-px flex-1 bg-gold/45" />
              </div>
            )}

            {/* Loading skeletons */}
            {tasksLoading &&
              [56, 140, 224].map((top) => (
                <div
                  key={top}
                  className="absolute left-2 right-2 h-9 animate-pulse rounded-xl bg-charcoal/[0.06]"
                  style={{ top }}
                />
              ))}

            {/* Task pills */}
            {!tasksLoading &&
              todayBlocks.map((block, idx) => {
                const topPx = hourToPx(block.hour);
                const heightPx = block.durationMinutes
                  ? Math.max(30, (block.durationMinutes / 60) * HOUR_HEIGHT)
                  : 40;

                const isLive =
                  activeTimeBlock?.tasks?.some(
                    (t) => t.taskId === block.taskId
                  ) ?? false;
                const isDark =
                  block.priority === "High" || block.category === "Work";

                return (
                  <motion.button
                    key={block.id}
                    type="button"
                    onClick={() => handleBlockClick(block.taskId)}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.22 }}
                    className={`absolute left-2 right-2 z-10 flex w-[calc(100%-1rem)] cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-medium shadow-soft transition-shadow hover:shadow-md active:scale-[0.985] ${
                      isLive
                        ? "bg-gold text-charcoal ring-2 ring-gold/70 shadow-[0_0_18px_rgba(250,204,21,0.45)]"
                        : isDark
                          ? "bg-charcoal text-white hover:bg-charcoal/90"
                          : "bg-white text-charcoal hover:bg-white/90"
                    }`}
                    style={{ top: topPx, height: heightPx }}
                    title={`Open ${block.title} in task list`}
                  >
                    {isLive && (
                      <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-charcoal/50" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-left">
                      {block.title}
                    </span>
                    <span className="ml-auto shrink-0 text-xs opacity-60">
                      {block.durationMinutes
                        ? `${block.durationMinutes}m`
                        : block.scheduledAt
                          ? formatScheduledTime(block.scheduledAt)
                          : formatHourLabel(Math.floor(block.hour))}
                    </span>
                  </motion.button>
                );
              })}

            {/* Empty state */}
            {!tasksLoading && todayBlocks.length === 0 && (
              <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-charcoal/35">
                No time blocks scheduled today
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
