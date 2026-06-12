"use client";

import { motion } from "framer-motion";

/**
 * @param {Object}  props
 * @param {Array<{ id: string, title: string, estimatedMs: number, actualMs: number, status: string, deltaMs: number }>} props.tasks
 * @param {{ totalEstimatedMs: number, totalActualMs: number, biasLabel: string }} [props.estimationTotals]
 * @param {boolean} [props.isLoading]
 */
export function EstimatedVsActual({ tasks = [], estimationTotals, isLoading = false }) {
  const withData = tasks.filter(
    (t) => t.estimatedMs > 0 || t.actualMs > 0
  );

  const maxMs = Math.max(...withData.map((t) => Math.max(t.estimatedMs, t.actualMs)), 1);

  function msToH(ms) {
    return (ms / 3_600_000).toFixed(1);
  }

  /** Translate the bias label into a human-readable badge */
  function biasDisplay(label) {
    if (!label || label === "insufficient_data") return null;
    if (label === "on_target") return { text: "On target", color: "text-emerald-600 bg-emerald-50" };
    if (label.startsWith("under"))
      return { text: label.replace(/_/g, " "), color: "text-amber-600 bg-amber-50" };
    return { text: label.replace(/_/g, " "), color: "text-blue-600 bg-blue-50" };
  }

  const bias = biasDisplay(estimationTotals?.biasLabel);

  return (
    <div className="glass-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Estimated vs Actual</h3>
        {bias && (
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${bias.color}`}>
            {bias.text}
          </span>
        )}
      </div>

      <div className="max-h-[360px] space-y-4 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-charcoal/5" />
            ))}
          </div>
        ) : withData.length === 0 ? (
          <p className="text-sm text-charcoal/50">No time data yet</p>
        ) : (
          withData.map((task, i) => (
            <div key={task.id}>
              <p className="mb-2 truncate text-sm font-medium">{task.title}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-charcoal/50">Est.</span>
                  <div className="stat-bar-track h-2 flex-1">
                    <motion.div
                      className="h-full rounded-full bg-charcoal/25"
                      initial={{ width: 0 }}
                      animate={{ width: `${(task.estimatedMs / maxMs) * 100}%` }}
                      transition={{ delay: i * 0.03 }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px]">
                    {msToH(task.estimatedMs)}h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-14 text-[10px] text-charcoal/50">Actual</span>
                  <div className="stat-bar-track h-2 flex-1">
                    <motion.div
                      className={`h-full rounded-full ${
                        task.deltaMs > 0 ? "bg-amber-400" : "bg-gold"
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(task.actualMs / maxMs) * 100}%` }}
                      transition={{ delay: i * 0.03 + 0.05 }}
                    />
                  </div>
                  <span className="w-10 text-right text-[10px]">
                    {msToH(task.actualMs)}h
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
