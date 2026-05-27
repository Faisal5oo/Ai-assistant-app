"use client";

import { motion } from "framer-motion";
import { useTaskStore } from "@/store/useTaskStore";
import { calculateFocusScore } from "@/lib/utils";
import { CheckCircle2, Clock, Target } from "lucide-react";

export function WelcomeHeader() {
  const tasks = useTaskStore((s) => s.tasks);
  const userName = useTaskStore((s) => s.userName);

  const completed = tasks.filter((t) => t.status === "Completed").length;
  const pending = tasks.filter((t) => t.status !== "Completed").length;
  const focusScore = calculateFocusScore(tasks);
  const total = tasks.length || 1;

  const metrics = [
    {
      label: "Completed",
      value: completed,
      pct: Math.round((completed / total) * 100),
      fill: "bg-charcoal",
      pattern: null,
    },
    {
      label: "Pending",
      value: pending,
      pct: Math.round((pending / total) * 100),
      fill: "bg-gold",
      pattern: null,
    },
    {
      label: "Focus Score",
      value: `${focusScore}%`,
      pct: focusScore,
      fill: "bg-charcoal/80",
      pattern: "pattern-stripes",
    },
    {
      label: "In Progress",
      value: tasks.filter((t) => t.status === "In-Progress").length,
      pct: Math.round(
        (tasks.filter((t) => t.status === "In-Progress").length / total) * 100
      ),
      fill: "bg-transparent border-2 border-charcoal/30",
      pattern: "pattern-dots",
    },
  ];

  const stats = [
    { icon: CheckCircle2, value: completed, label: "Completed" },
    { icon: Clock, value: pending, label: "Pending" },
    { icon: Target, value: focusScore, label: "Focus %" },
  ];

  return (
    <section className="mb-8">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-display text-3xl font-medium tracking-tight md:text-4xl lg:text-5xl"
      >
        Welcome in, {userName}
      </motion.h1>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="mb-2 flex justify-between text-xs font-medium text-charcoal/60">
                <span>{m.label}</span>
                <span>{typeof m.value === "number" ? m.value : m.value}</span>
              </div>
              <div className="stat-bar-track">
                <motion.div
                  className={`h-full rounded-full ${m.fill} ${m.pattern ?? ""}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(m.pct, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-8">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-right">
              <p className="font-display text-3xl font-semibold md:text-4xl">
                {value}
              </p>
              <p className="mt-1 flex items-center justify-end gap-1 text-xs text-charcoal/50">
                <Icon size={12} />
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
