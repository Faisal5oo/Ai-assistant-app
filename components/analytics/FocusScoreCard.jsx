"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, CheckCircle2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

/**
 * @param {Object}  props
 * @param {number}  props.focusScore          0-100
 * @param {{ completionRate: number, accuracyRate: number, highPriorityRate: number }} props.scoreComponents
 * @param {{ total: number, completed: number, withinEstimate: number }} props.taskCounts
 * @param {number|null} props.scoreDeltaPct   period-over-period % change (null = no baseline)
 * @param {boolean} [props.isLoading]
 */
export function FocusScoreCard({
  focusScore = 0,
  scoreComponents = { completionRate: 0, accuracyRate: 0, highPriorityRate: 0 },
  taskCounts = { total: 0, completed: 0, withinEstimate: 0 },
  scoreDeltaPct = null,
  isLoading = false,
}) {
  const R = 80;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - focusScore / 100);

  const trendLabel =
    focusScore >= 70 ? "Strong focus" : focusScore >= 40 ? "Building momentum" : "Room to grow";

  const DeltaBadge = () => {
    if (scoreDeltaPct === null) return null;
    const positive = scoreDeltaPct >= 0;
    const Icon = scoreDeltaPct === 0 ? Minus : positive ? ArrowUpRight : ArrowDownRight;
    return (
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${
          positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
        }`}
      >
        <Icon size={12} />
        {Math.abs(scoreDeltaPct)}%
      </span>
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Focus Score</h3>
        {!isLoading && <DeltaBadge />}
      </div>

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
              animate={{ strokeDashoffset: isLoading ? C : offset }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-4xl font-bold">
              {isLoading ? "—" : focusScore}
            </span>
            <span className="text-sm text-charcoal/50">/ 100</span>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <p className="text-charcoal/60">
            Based on completion rate, time accuracy, and high-priority delivery.
          </p>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold" />
            <span>{taskCounts.completed} tasks completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Target size={16} className="text-charcoal/50" />
            <span>{taskCounts.withinEstimate} within time estimate</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-charcoal/50" />
            <span>{trendLabel}</span>
          </div>

          {/* Component breakdown mini-bars */}
          <div className="space-y-1.5 pt-1">
            {[
              { label: "Completion", value: scoreComponents.completionRate },
              { label: "Accuracy", value: scoreComponents.accuracyRate },
              { label: "High Priority", value: scoreComponents.highPriorityRate },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-20 text-[10px] text-charcoal/50">{label}</span>
                <div className="stat-bar-track h-1.5 flex-1">
                  <motion.div
                    className="h-full rounded-full bg-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <span className="w-8 text-right text-[10px] text-charcoal/60">
                  {value.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
