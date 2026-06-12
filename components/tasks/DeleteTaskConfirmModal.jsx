"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { ViewportModal } from "@/components/ui/ViewportModal";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {import('@/types/interfaces').Task | null} props.task
 * @param {boolean} props.isDeleting
 * @param {() => void} props.onClose
 * @param {() => void} props.onConfirm
 */
export function DeleteTaskConfirmModal({
  open,
  task,
  isDeleting,
  onClose,
  onConfirm,
}) {
  return (
    <ViewportModal
      open={open}
      onClose={onClose}
      ariaLabel="Confirm task deletion"
      panelClassName="w-full max-w-md rounded-4xl bg-cream-50 p-6 shadow-soft md:p-8"
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
        <AlertTriangle size={22} strokeWidth={2} />
      </div>

      <h2 className="font-display text-xl font-semibold tracking-tight text-charcoal">
        Delete task?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-charcoal/55">
        {task ? (
          <>
            <span className="font-medium text-charcoal">&ldquo;{task.title}&rdquo;</span>{" "}
            will be permanently removed. This action cannot be undone.
          </>
        ) : (
          "This task will be permanently removed. This action cannot be undone."
        )}
      </p>

      {task && (
        <p className="mt-3 rounded-2xl bg-white/70 px-4 py-3 text-xs text-charcoal/50 ring-1 ring-charcoal/5">
          If this task has an active focus timer, it will be stopped immediately.
        </p>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="pill-btn-ghost w-full sm:w-auto"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting || !task}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
        >
          {isDeleting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Deleting…
            </>
          ) : (
            "Delete task"
          )}
        </button>
      </div>
    </ViewportModal>
  );
}
