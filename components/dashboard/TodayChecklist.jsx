"use client";

import { motion } from "framer-motion";
import {
  Video,
  Users,
  Monitor,
  FileText,
  Calendar,
  Check,
} from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";
import { formatScheduledTime } from "@/lib/utils";
import { format } from "date-fns";

const ICONS = [Video, Users, Monitor, FileText, Calendar, Video, Users, Monitor];

export function OnboardingProgress() {
  const tasks = useTaskStore((s) => s.tasks);
  const today = tasks.filter(
    (t) => t.status !== "Completed" || t.actualTimeSpent > 0
  );
  const done = tasks.filter((t) => t.status === "Completed").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <p className="text-3xl font-display font-semibold">{pct}%</p>
      <p className="mb-3 text-xs text-charcoal/50">Daily completion</p>
      <div className="flex h-2 gap-1 overflow-hidden rounded-full">
        <div className="flex-[2] rounded-full bg-gold" />
        <div className="flex-1 rounded-full bg-charcoal" />
        <div className="flex-1 rounded-full bg-charcoal/15" />
      </div>
      <p className="mt-2 text-xs text-charcoal/40">
        {done} of {tasks.length} tasks done
      </p>
    </div>
  );
}

export function TodayChecklist() {
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTaskComplete = useTaskStore((s) => s.toggleTaskComplete);

  const todayTodos = tasks
    .filter((t) => t.status !== "Completed")
    .slice(0, 8);
  const completedCount = tasks.filter((t) => t.status === "Completed").length;

  return (
    <motion.div
      layout
      className="glass-card-dark flex flex-col p-5 md:min-h-[420px]"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Today&apos;s Tasks</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
          {completedCount}/{tasks.length}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {todayTodos.length === 0 ? (
          <li className="py-8 text-center text-sm text-white/50">
            All caught up!
          </li>
        ) : (
          todayTodos.map((task, i) => {
            const Icon = ICONS[i % ICONS.length];
            const timeLabel = task.scheduledAt
              ? formatScheduledTime(task.scheduledAt)
              : format(new Date(task.createdAt), "MMM d");
            const done = task.status === "Completed";

            return (
              <motion.li
                key={task.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-white/50">{timeLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleTaskComplete(task.id)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    done
                      ? "border-gold bg-gold text-charcoal"
                      : "border-white/30 hover:border-gold"
                  }`}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done && <Check size={14} strokeWidth={3} />}
                </button>
              </motion.li>
            );
          })
        )}
      </ul>
    </motion.div>
  );
}
