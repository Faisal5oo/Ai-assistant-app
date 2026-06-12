"use client";

import { useCallback, useState } from "react";
import { useDeleteTaskMutation } from "@/hooks/queries/useTaskMutations";

/**
 * @returns {{
 *   deleteTarget: import('@/types/interfaces').Task | null;
 *   requestDelete: (task: import('@/types/interfaces').Task) => void;
 *   cancelDelete: () => void;
 *   confirmDelete: () => void;
 *   isDeleting: boolean;
 * }}
 */
export function useConfirmDeleteTask() {
  const [deleteTarget, setDeleteTarget] = useState(
    /** @type {import('@/types/interfaces').Task | null} */ (null)
  );
  const deleteMutation = useDeleteTaskMutation();

  const requestDelete = useCallback((task) => {
    setDeleteTarget(task);
  }, []);

  const cancelDelete = useCallback(() => {
    if (!deleteMutation.isPending) {
      setDeleteTarget(null);
    }
  }, [deleteMutation.isPending]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteMutation]);

  return {
    deleteTarget,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting: deleteMutation.isPending,
  };
}
