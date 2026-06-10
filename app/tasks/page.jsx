"use client";

import { useEffect } from "react";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TasksSkeleton } from "@/components/tasks/TasksSkeleton";
import { useTasksQuery } from "@/hooks/queries/useTasksQuery";
import { appToast } from "@/lib/toast";

export default function TasksPage() {
  const { isLoading, isError, error } = useTasksQuery();

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
