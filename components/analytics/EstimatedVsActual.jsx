"use client";

import { motion } from "framer-motion";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import { msToHours } from "@/lib/utils";

export function EstimatedVsActual() {
  const { tasks } = useTasks();
  const withData = tasks.filter(
    (t) => t.estimatedTime > 0 || t.actualTimeSpent > 0
  );
  const maxHours = Math.max(
    ...withData.map((t) =>
      Math.max(t.estimatedTime / 60, t.actualTimeSpent / (1000 * 60 * 60))
    ),
    1
  );

  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 font-display text-lg font-semibold">
        Estimated vs Actual
      </h3>
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
        {withData.length === 0 ? (
          <p className="text-sm text-charcoal/50">No time data yet</p>
        ) : (
          withData.map((task, i) => {
            const estH = task.estimatedTime / 60;
            const actH = task.actualTimeSpent / (1000 * 60 * 60);
            return (
              <div key={task.id}>
                <p className="mb-2 truncate text-sm font-medium">{task.title}</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-[10px] text-charcoal/50">Est.</span>
                    <div className="stat-bar-track h-2 flex-1">
                      <motion.div
                        className="h-full rounded-full bg-charcoal/25"
                        initial={{ width: 0 }}
                        animate={{ width: `${(estH / maxHours) * 100}%` }}
                        transition={{ delay: i * 0.03 }}
                      />
                    </div>
                    <span className="w-10 text-right text-[10px]">
                      {estH.toFixed(1)}h
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-14 text-[10px] text-charcoal/50">Actual</span>
                    <div className="stat-bar-track h-2 flex-1">
                      <motion.div
                        className="h-full rounded-full bg-gold"
                        initial={{ width: 0 }}
                        animate={{ width: `${(actH / maxHours) * 100}%` }}
                        transition={{ delay: i * 0.03 + 0.05 }}
                      />
                    </div>
                    <span className="w-10 text-right text-[10px]">
                      {actH.toFixed(1)}h
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
