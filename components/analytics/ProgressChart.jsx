"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWeekRangeLabel } from "@/lib/progress-timeline";

/**
 * @param {string} dateStr
 */
function parseLocalDateKey(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * @param {Object}  props
 * @param {Array<{ date: string, totalMs: number, totalHours?: number, isToday?: boolean }>} props.timeline
 * @param {number}  props.totalTrackedHours
 * @param {"week"|"month"} props.range
 * @param {boolean} [props.isLoading]
 * @param {number} [props.weekOffset=0]
 * @param {(offset: number) => void} [props.onWeekOffsetChange]
 * @param {string} [props.weekRangeLabel]
 */
export function ProgressChart({
  timeline = [],
  totalTrackedHours = 0,
  range = "week",
  isLoading = false,
  weekOffset = 0,
  onWeekOffsetChange,
  weekRangeLabel,
}) {
  const [hovered, setHovered] = useState(/** @type {string|null} */ (null));

  const maxMs = Math.max(...timeline.map((d) => d.totalMs), 1);
  const canGoForward = weekOffset < 0;
  const showWeekNav = range === "week" && typeof onWeekOffsetChange === "function";

  function dayLabel(dateStr, index) {
    const d = parseLocalDateKey(dateStr);
    if (range === "week") {
      return format(d, "EEEEE");
    }
    return index % 5 === 0 ? format(d, "d") : "";
  }

  function formatHoursMinutes(ms) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const subtitle =
    range === "month"
      ? "Work Time last 30 days"
      : weekOffset === 0
        ? "Work Time this week"
        : weekRangeLabel
          ? `Work Time · ${weekRangeLabel}`
          : "Work Time";

  return (
    <motion.div layout className="glass-card p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-charcoal/60">Progress</p>
          <p className="font-display text-xl font-semibold">
            {totalTrackedHours.toFixed(1)} h{" "}
            <span className="text-base font-normal text-charcoal/50">{subtitle}</span>
          </p>
        </div>

        {showWeekNav && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onWeekOffsetChange(weekOffset - 1)}
              className="rounded-lg p-2 text-charcoal/50 transition hover:bg-charcoal/5 hover:text-charcoal"
              aria-label="Previous week"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => canGoForward && onWeekOffsetChange(weekOffset + 1)}
              disabled={!canGoForward}
              className="rounded-lg p-2 text-charcoal/50 transition hover:bg-charcoal/5 hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next week"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-40 items-end gap-1">
          {Array.from({ length: range === "week" ? 7 : 30 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-full bg-charcoal/8"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-end justify-between gap-1 sm:gap-1.5">
          {timeline.map((day, i) => {
            const barHeight = Math.max(12, (day.totalMs / maxMs) * 140);
            const isHov = hovered === day.date;
            const highlight = day.isToday || isHov;
            return (
              <div
                key={day.date}
                className="relative flex h-full flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHovered(day.date)}
                onMouseLeave={() => setHovered(null)}
              >
                <AnimatePresence>
                  {isHov && day.totalMs > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -top-10 z-10 whitespace-nowrap rounded-xl bg-charcoal px-2 py-1 text-xs text-white"
                    >
                      {formatHoursMinutes(day.totalMs)}
                    </motion.div>
                  )}
                </AnimatePresence>
                <motion.div
                  className={`w-full max-w-[36px] rounded-full ${
                    highlight ? "bg-gold" : "bg-charcoal/15"
                  }`}
                  initial={{ height: 12 }}
                  animate={{ height: barHeight }}
                  transition={{ delay: i * 0.025, duration: 0.45 }}
                />
                <span className="mt-2 text-[10px] text-charcoal/50">
                  {dayLabel(day.date, i)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export { formatWeekRangeLabel };
