"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Trash2 } from "lucide-react";
import { BucketEmptyState } from "./BucketEmptyState";
import { BatchBucketTaskItem } from "./BatchBucketTaskItem";

/**
 * @param {Object} props
 * @param {import('@/lib/batchingConstants').BatchBucketDef} props.bucket
 * @param {import('@/types/interfaces').Task[]} props.tasks
 * @param {string | null} props.draggingTaskId
 * @param {(bucketId: string) => void} props.onStartSprint
 * @param {(taskId: string, title: string, x: number, y: number) => void} props.onDragStart
 * @param {(taskId: string) => void} props.onRemoveTask
 * @param {(bucketId: string, title: string) => void} props.onRenameBucket
 * @param {(bucketId: string) => void} [props.onDeleteBucket]
 * @param {number} props.index
 */
export function BatchBucketCard({
  bucket,
  tasks,
  draggingTaskId,
  onStartSprint,
  onDragStart,
  onRemoveTask,
  onRenameBucket,
  onDeleteBucket,
  index,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(bucket.title);
  const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  const isEmpty = tasks.length === 0;
  const Icon = bucket.Icon;
  const isCustom = Boolean(bucket.isCustom);

  useEffect(() => {
    if (!isEditingTitle) {
      setDraftTitle(bucket.title);
    }
  }, [bucket.title, isEditingTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const commitTitle = useCallback(() => {
    const trimmed = draftTitle.trim() || bucket.title;
    onRenameBucket(bucket.id, trimmed);
    setDraftTitle(trimmed);
    setIsEditingTitle(false);
  }, [draftTitle, bucket.id, bucket.title, onRenameBucket]);

  return (
    <motion.article
      layout
      data-batch-bucket={bucket.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`group batch-drop-zone glass-card relative flex flex-col bg-gradient-to-br ${bucket.accent} p-6`}
    >
      {isCustom && onDeleteBucket && (
        <button
          type="button"
          aria-label="Delete batch"
          onClick={() => onDeleteBucket(bucket.id)}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-charcoal/35 transition hover:bg-charcoal/8 hover:text-charcoal"
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      )}

      <div className="mb-4 flex items-start justify-between gap-3 pr-8">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-charcoal shadow-glass">
            <Icon size={20} strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={commitTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTitle();
                  if (e.key === "Escape") {
                    setDraftTitle(bucket.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="input-field !rounded-xl !py-1.5 font-display text-lg font-semibold"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="block max-w-full truncate text-left font-display text-lg font-semibold text-charcoal transition hover:text-charcoal/80"
                title="Click to rename batch"
              >
                {bucket.title}
              </button>
            )}
            <p className="mt-1 text-xs leading-relaxed text-charcoal/50">
              {bucket.subtitle}
            </p>
          </div>
        </div>
        <span className="flex h-9 min-w-[2.25rem] shrink-0 items-center justify-center rounded-full bg-charcoal/8 px-2 text-sm font-semibold text-charcoal">
          {tasks.length}
        </span>
      </div>

      <div className="min-h-[120px] flex-1">
        {isEmpty ? (
          <BucketEmptyState icon={Icon} />
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id}>
                <BatchBucketTaskItem
                  task={task}
                  isDragging={draggingTaskId === task.id}
                  onDragStart={onDragStart}
                  onRemove={onRemoveTask}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={isEmpty}
        onClick={() => onStartSprint(bucket.id)}
        className="pill-btn-gold mt-5 w-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Play size={16} fill="currentColor" />
        Start Batch Sprint
      </button>
    </motion.article>
  );
}
