"use client";

import { motion } from "framer-motion";
import { useBatchDrag } from "@/hooks/useBatchDrag";
import { useViewportEdgeScroll } from "@/hooks/useViewportEdgeScroll";
import { BatchBucketCard } from "./BatchBucketCard";
import { QuickSortPanel } from "./QuickSortPanel";
import { DragGhost } from "./DragGhost";
import { CreateBatchCard } from "./CreateBatchCard";
import { DraggableTaskChip } from "./DraggableTaskChip";
import { MobileDockSheet } from "@/components/ui/MobileDockSheet";
import { POOL_ZONE_ID } from "@/lib/batchingConstants";

/**
 * @param {Object} props
 * @param {import('@/lib/batchingConstants').BatchBucketDef[]} props.buckets
 * @param {Record<string, import('@/types/interfaces').Task[]>} props.clusters
 * @param {import('@/types/interfaces').Task[]} props.unbatched
 * @param {(bucketId: string) => void} props.onStartSprint
 * @param {(taskId: string, zoneId: string) => void} props.onMoveTask
 * @param {(taskId: string) => void} props.onRemoveTask
 * @param {() => string} props.onCreateBucket
 * @param {(bucketId: string, title: string) => void} props.onRenameBucket
 * @param {(bucketId: string) => void} props.onDeleteBucket
 */
export function BatchManager({
  buckets,
  clusters,
  unbatched,
  onStartSprint,
  onMoveTask,
  onRemoveTask,
  onCreateBucket,
  onRenameBucket,
  onDeleteBucket,
}) {
  const { session, isDragging, draggingTaskId, startDrag, registerGhostMover } =
    useBatchDrag({
      onDrop: onMoveTask,
    });

  useViewportEdgeScroll({ isDragging });

  return (
    <>
      {/*
        Mobile layout:
          - Buckets stack as single-column full-width rows
          - pb-[34vh] keeps the last bucket above the dock sheet
          - QuickSortPanel (desktop fixed bottom) is hidden on mobile;
            MobileDockSheet takes its place
        Desktop layout:
          - sm:grid-cols-2 bucket grid unchanged
          - QuickSortPanel renders as before
      */}
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.5 }}
        className="pb-[34vh] md:pb-52"
      >
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
            Phase 1 — Clustering
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-charcoal md:text-3xl">
            Smart batch buckets
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-charcoal/50">
            Drag freely between the pool and any bucket — reorder clusters, rename
            batches, or create your own.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {buckets.map((bucket, index) => (
            <BatchBucketCard
              key={bucket.id}
              bucket={bucket}
              tasks={clusters[bucket.id] ?? []}
              draggingTaskId={draggingTaskId}
              onStartSprint={onStartSprint}
              onDragStart={startDrag}
              onRemoveTask={onRemoveTask}
              onRenameBucket={onRenameBucket}
              onDeleteBucket={bucket.isCustom ? onDeleteBucket : undefined}
              index={index}
            />
          ))}
          <CreateBatchCard onCreate={onCreateBucket} index={buckets.length} />
        </div>
      </motion.div>

      {/* Desktop: existing fixed quick-sort panel (hidden below md) */}
      <div className="hidden md:block">
        <QuickSortPanel
          unbatched={unbatched}
          draggingTaskId={draggingTaskId}
          onDragStart={startDrag}
        />
      </div>

      {/* Mobile: dock sheet replaces the quick-sort panel */}
      <MobileDockSheet
        title="Quick sort pool"
        count={unbatched.length}
        dropZoneAttr={{ "data-batch-drop": "pool" }}
        isHoverTarget={false}
        emptyLabel="All tasks are batched. Sprint when ready."
      >
        {unbatched.map((task) => (
          <DraggableTaskChip
            key={task.id}
            task={task}
            isDragging={draggingTaskId === task.id}
            onDragStart={startDrag}
          />
        ))}
      </MobileDockSheet>

      {isDragging && session.taskTitle && (
        <DragGhost
          title={session.taskTitle}
          initialX={session.startX}
          initialY={session.startY}
          registerMover={registerGhostMover}
        />
      )}
    </>
  );
}
