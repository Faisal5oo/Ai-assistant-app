"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TasksSkeleton } from "@/components/tasks/TasksSkeleton";
import { useTasksQuery } from "@/hooks/queries/useTasksQuery";
import { useTaskStore } from "@/store/useTaskStore";
import { appToast } from "@/lib/toast";

export default function TasksPage() {
  const { isLoading, isError, error } = useTasksQuery();
  const searchParams = useSearchParams();
  const setHighlightedTaskId = useTaskStore((s) => s.setHighlightedTaskId);

  // Sync ?highlight=<taskId> from the calendar click into the store.
  // The 380 ms delay lets the list finish its initial paint so the user
  // clearly sees the card slide from its natural position to the top.
  useEffect(() => {
    const id = searchParams.get("highlight");
    if (!id) return;
    const t = setTimeout(() => setHighlightedTaskId(id), 380);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isError) {
      appToast.error(error, "Could not load tasks.");
    }
  }, [isError, error]);

  if (isLoading) {
    return <TasksSkeleton />;
  }

  return <KanbanBoard />;
}
