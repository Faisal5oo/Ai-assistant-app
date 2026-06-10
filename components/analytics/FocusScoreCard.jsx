"use client";

import { motion } from "framer-motion";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { calculateFocusScore } from "@/lib/utils";
import { Target, TrendingUp, CheckCircle2 } from "lucide-react";

export function FocusScoreCard() {
  const { tasks } = useTasks();
  const score = calculateFocusScore(tasks);
  const completed = tasks.filter((t) => t.status === "Completed").length;
  const accurate = tasks.filter((t) => {
    if (!t.estimatedTime || !t.actualTimeSpent) return false;
    const ratio = t.actualTimeSpent / (t.estimatedTime * 60 * 1000);
    return ratio >= 0.8 && ratio <= 1.2;
  }).length;

  const R = 80;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - score / 100);

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold">Focus Score</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative">
          <svg width={200} height={200} className="-rotate-90">
            <circle
              cx={100}
              cy={100}
              r={R}
              fill="none"
              stroke="rgba(26,26,26,0.08)"
              strokeWidth={12}
            />
            <motion.circle
              cx={100}
              cy={100}
              r={R}
              fill="none"
              stroke="#FACC15"
              strokeWidth={12}
              strokeLinecap="round"
              strokeDasharray={C}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold">{score}</span>
            <span className="text-sm text-charcoal/50">/ 100</span>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-charcoal/60">
            Based on completion rate, time accuracy, and high-priority delivery.
          </p>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold" />
            <span>{completed} tasks completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-charcoal/50" />
            <span>{accurate} within time estimate</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-charcoal/50" />
            <span>
              {score >= 70 ? "Strong focus" : score >= 40 ? "Building momentum" : "Room to grow"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
