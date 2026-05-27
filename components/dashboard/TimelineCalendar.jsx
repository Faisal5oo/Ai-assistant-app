"use client";

import { format } from "date-fns";
import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { formatScheduledTime, getHourFromIso, isScheduledToday } from "@/lib/utils";

const HOURS = [8, 9, 10, 11];
const HOUR_HEIGHT = 56;

export function TimelineCalendar() {
  const tasks = useTaskStore((s) => s.tasks);
  const todayTasks = tasks
    .filter((t) => t.scheduledAt && isScheduledToday(t.scheduledAt))
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );

  const monthLabel = format(new Date(), "MMMM yyyy");

  return (
    <motion.div layout className="glass-card col-span-full p-6 lg:col-span-2">
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

      <div className="relative flex gap-4 overflow-x-auto">
        <div className="flex shrink-0 flex-col text-xs text-charcoal/40">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: HOUR_HEIGHT }}
              className="flex items-start pt-1"
            >
              {h === 8 ? "8:00 am" : h === 9 ? "9:00 am" : h === 10 ? "10:00 am" : "11:00 am"}
            </div>
          ))}
        </div>

        <div
          className="relative min-h-[224px] flex-1 rounded-3xl bg-white/30"
          style={{ height: HOURS.length * HOUR_HEIGHT }}
        >
          {HOURS.map((h, i) => (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-charcoal/5"
              style={{ top: i * HOUR_HEIGHT }}
            />
          ))}

          {todayTasks.map((task, i) => {
            const hour = getHourFromIso(task.scheduledAt);
            const top = Math.max(0, (hour - 8) * HOUR_HEIGHT);
            const isDark = task.priority === "High" || task.category === "Work";
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`absolute left-2 right-2 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-soft ${
                  isDark
                    ? "bg-charcoal text-white"
                    : "bg-white text-charcoal"
                }`}
                style={{ top: `${top}px` }}
              >
                <span className="truncate">{task.title}</span>
                <span className="ml-auto shrink-0 text-xs opacity-70">
                  {formatScheduledTime(task.scheduledAt)}
                </span>
              </motion.div>
            );
          })}

          {todayTasks.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-charcoal/40">
              No tasks scheduled for today
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
