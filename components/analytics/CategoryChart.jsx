"use client";

import { motion } from "framer-motion";
import { CATEGORIES } from "@/types/interfaces";
import { msToHours } from "@/lib/utils";

/**
 * @param {Object}  props
 * @param {Record<string, number>} props.dataByCategory - ms per category
 * @param {boolean} [props.isLoading]
 */
export function CategoryChart({ dataByCategory, isLoading = false }) {
  const values = CATEGORIES.map((c) => ({
    category: c,
    ms: dataByCategory[c] ?? 0,
  }));
  const maxMs = Math.max(...values.map((v) => v.ms), 1);
  const totalMs = values.reduce((s, v) => s + v.ms, 0);

  const COLORS = {
    Work: "#1A1A1A",
    Personal: "#FACC15",
    Learning: "#60A5FA",
    Health: "#34D399",
  };

  let cumulative = 0;
  const segments = values.map((v) => {
    const pct = totalMs > 0 ? (v.ms / totalMs) * 100 : 25;
    const seg = { ...v, pct, offset: cumulative };
    cumulative += pct;
    return seg;
  });

  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold">
        Time by Category
      </h3>

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative">
          <svg width={180} height={180} className="-rotate-90">
            <circle
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke="rgba(26,26,26,0.06)"
              strokeWidth={24}
            />
            {segments.map((seg, i) => {
              const dash = (seg.pct / 100) * C;
              const offset = -(seg.offset / 100) * C;
              return (
                <motion.circle
                  key={seg.category}
                  cx={90}
                  cy={90}
                  r={R}
                  fill="none"
                  stroke={COLORS[seg.category]}
                  strokeWidth={24}
                  strokeDasharray={`${dash} ${C}`}
                  strokeDashoffset={offset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-semibold">
              {msToHours(totalMs).toFixed(1)}h
            </span>
            <span className="text-xs text-charcoal/50">Total tracked</span>
          </div>
        </div>

        <ul className="flex-1 space-y-3">
          {values.map((v, i) => (
            <li key={v.category}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: COLORS[v.category] }}
                  />
                  {v.category}
                </span>
                <span className="font-medium">
                  {msToHours(v.ms).toFixed(1)}h
                </span>
              </div>
              <div className="stat-bar-track h-2">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: COLORS[v.category] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(v.ms / maxMs) * 100}%` }}
                  transition={{ delay: i * 0.05 }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
