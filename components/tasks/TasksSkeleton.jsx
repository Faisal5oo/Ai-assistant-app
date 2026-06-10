"use client";

import { motion } from "framer-motion";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";

export function TasksSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <SkeletonText className="mb-2 h-8 w-48" />
          <SkeletonText className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {["Todo", "In Progress", "Completed"].map((col) => (
          <div key={col} className="glass-card min-h-[520px] p-4">
            <SkeletonText className="mb-4 h-5 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-charcoal/5 p-4">
                  <SkeletonText className="mb-3 h-4 w-4/5" />
                  <div className="mb-3 flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <SkeletonText className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
