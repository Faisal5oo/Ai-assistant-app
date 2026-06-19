"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/hooks/queries/useDashboardQuery";
import { buildWeeklyProgressTimeline } from "@/lib/progress-timeline";
import { formatMsToHoursMinutes, msToHours } from "@/lib/utils";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeeklyProgressChart() {
  const { dailyLogs, isFetching } = useDashboard();
  const [hovered, setHovered] = useState(null);

  const { timeline, totalMs } = useMemo(
    () => buildWeeklyProgressTimeline(dailyLogs, 0),
    [dailyLogs]
  );

  const weekDays = timeline.map((day) => {
    const d = parseLocalDateKey(day.date);
    return {
      key: day.date,
      label: DAY_LABELS[d.getDay()],
      totalMs: day.totalMs,
      isToday: day.isToday,
    };
  });

  const maxMs = Math.max(...weekDays.map((d) => d.totalMs), 1);
  const weekHours = msToHours(totalMs).toFixed(1);

  return (
    <motion.div layout className="glass-card p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-charcoal/60">Progress</p>
          <p className="font-display text-xl font-semibold">
            {isFetching ? (
              <span className="inline-block h-6 w-20 animate-pulse rounded-lg bg-charcoal/10" />
            ) : (
              <>
                {weekHours} h{" "}
                <span className="text-base font-normal text-charcoal/50">
                  Work Time this week
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex h-40 items-end justify-between gap-2 sm:gap-3">
        {weekDays.map((day, i) => {
          const barHeight = Math.max(12, (day.totalMs / maxMs) * 140);
          const isHovered = hovered === day.key;
          return (
            <div
              key={day.key}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHovered(day.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <AnimatePresence>
                {isHovered && day.totalMs > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-10 z-10 rounded-xl bg-charcoal px-2 py-1 text-xs text-white"
                  >
                    {formatMsToHoursMinutes(day.totalMs)}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                className={`w-full max-w-[36px] rounded-full ${
                  day.isToday || isHovered ? "bg-gold" : "bg-charcoal/15"
                }`}
                initial={{ height: 12 }}
                animate={{ height: barHeight }}
                transition={{ delay: i * 0.04, duration: 0.5 }}
              />
              <span className="mt-2 text-xs text-charcoal/50">{day.label}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * @param {string} dateStr
 */
function parseLocalDateKey(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
