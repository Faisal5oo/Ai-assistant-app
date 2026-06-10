"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, subDays } from "date-fns";
import { useDashboard } from "@/hooks/queries/useDashboardQuery";
import { formatMsToHoursMinutes, msToHours } from "@/lib/utils";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function WeeklyProgressChart() {
  const { dailyLogs } = useDashboard();
  const [hovered, setHovered] = useState(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const key = format(d, "yyyy-MM-dd");
    const log = dailyLogs.find((l) => l.date === key);
    return {
      key,
      label: DAY_LABELS[d.getDay()],
      totalMs: log?.totalMs ?? 0,
      isToday: i === 6,
    };
  });

  const maxMs = Math.max(...weekDays.map((d) => d.totalMs), 1);
  const weekTotalMs = weekDays.reduce((s, d) => s + d.totalMs, 0);
  const weekHours = msToHours(weekTotalMs).toFixed(1);

  return (
    <motion.div layout className="glass-card p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-charcoal/60">Progress</p>
          <p className="font-display text-xl font-semibold">
            {weekHours} h{" "}
            <span className="text-base font-normal text-charcoal/50">
              Work Time this week
            </span>
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
