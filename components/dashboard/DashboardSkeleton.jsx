"use client";

import { motion } from "framer-motion";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div>
        <SkeletonText className="mb-4 h-10 w-72 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <SkeletonText className="mb-2 h-3 w-20" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="glass-card p-5 lg:col-span-3">
          <SkeletonCircle className="mx-auto mb-4 h-24 w-24" />
          <SkeletonText className="mx-auto mb-2 h-5 w-32" />
          <SkeletonText className="mx-auto h-3 w-40" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:col-span-6">
          <div className="glass-card p-6">
            <SkeletonText className="mb-2 h-4 w-24" />
            <SkeletonText className="mb-6 h-7 w-40" />
            <div className="flex h-40 items-end justify-between gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-full max-w-[36px] rounded-full"
                  style={{ height: 40 + (i % 3) * 24 }}
                />
              ))}
            </div>
          </div>

          <div className="glass-card flex flex-col items-center p-6">
            <Skeleton className="mb-4 h-40 w-40 rounded-full" />
            <SkeletonText className="mb-2 h-5 w-36" />
            <SkeletonText className="h-3 w-24" />
          </div>

          <div className="glass-card p-6 sm:col-span-2">
            <SkeletonText className="mb-4 h-5 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-3">
          <div className="glass-card p-5">
            <SkeletonText className="mb-2 h-8 w-16" />
            <SkeletonText className="mb-3 h-3 w-28" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>

          <div className="glass-card-dark min-h-[420px] p-5">
            <SkeletonText className="mb-4 h-5 w-36" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkeletonCircle className="h-9 w-9" />
                  <div className="flex-1 space-y-2">
                    <SkeletonText className="h-4 w-3/4" />
                    <SkeletonText className="h-3 w-1/3" />
                  </div>
                  <SkeletonCircle className="h-7 w-7" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
