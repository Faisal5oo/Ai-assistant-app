"use client";



import { useCallback, useState } from "react";

import { motion } from "framer-motion";

import { ListTodo, Plus } from "lucide-react";

import { useTaskStore } from "@/store/useTaskStore";
import { useTasks } from "@/hooks/queries/useTasksQuery";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useReorderTasksMutation,
} from "@/hooks/queries/useTaskMutations";

import { KANBAN_SPRING, KANBAN_STATUSES } from "@/lib/kanban";

import { useKanbanDrag } from "@/hooks/useKanbanDrag";

import { KanbanColumn } from "./KanbanColumn";

import { KanbanDragGhost } from "./KanbanDragGhost";

import { TaskModal } from "./TaskModal";



export function KanbanBoard() {

  const { tasks } = useTasks();
  const batchingFilterTag = useTaskStore((s) => s.batchingFilterTag);
  const setBatchingFilterTag = useTaskStore((s) => s.setBatchingFilterTag);
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const deleteTask = useDeleteTaskMutation();
  const reorderTasksMutation = useReorderTasksMutation();



  const [modalOpen, setModalOpen] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

  const [hoverStatus, setHoverStatus] = useState(

    /** @type {string | null} */ (null)

  );



  const visibleTasks = batchingFilterTag

    ? tasks.filter(

        (t) =>

          t.tags.some(

            (tg) => tg.toLowerCase() === batchingFilterTag.toLowerCase()

          ) || t.status === "Completed"

      )

    : tasks;



  const syncColumn = useCallback(
    (columnId, orderedTasks, sourceColumnId, sourceOrderedTasks) => {
      reorderTasksMutation.mutate({
        columnId,
        taskIds: orderedTasks.map((t) => t.id),
        ...(sourceColumnId && sourceOrderedTasks
          ? {
              sourceColumnId,
              sourceTaskIds: sourceOrderedTasks.map((t) => t.id),
            }
          : {}),
      });
    },
    [reorderTasksMutation]
  );

  const handleDrop = useCallback(
    (taskId, status, sourceStatus, dropIndex) => {
      if (!status) return;

      const columnTasks = visibleTasks.filter((t) => t.status === status);
      const sourceTasks = sourceStatus
        ? visibleTasks.filter((t) => t.status === sourceStatus)
        : [];
      const startIndex = sourceTasks.findIndex((t) => t.id === taskId);

      if (status === sourceStatus) {
        if (startIndex < 0) return;
        let endIndex = dropIndex;
        if (endIndex > startIndex) endIndex -= 1;
        if (endIndex === startIndex) return;

        const nextColumn = [...sourceTasks];
        const [moved] = nextColumn.splice(startIndex, 1);
        nextColumn.splice(endIndex, 0, moved);
        syncColumn(status, nextColumn);
        return;
      }

      const without = visibleTasks.filter((t) => t.id !== taskId);
      const task = visibleTasks.find((t) => t.id === taskId);
      if (!task) return;

      const column = without.filter((t) => t.status === status);
      const clamped = Math.max(0, Math.min(dropIndex, columnTasks.length));
      column.splice(clamped, 0, { ...task, status });

      const sourceColumn = sourceStatus
        ? sourceTasks.filter((t) => t.id !== taskId)
        : null;

      syncColumn(status, column, sourceStatus, sourceColumn);
    },
    [visibleTasks, syncColumn]
  );



  const { session, isDragging, draggingTaskId, startDrag, registerGhostMover } =
    useKanbanDrag({
      onDrop: handleDrop,
      onHoverStatus: setHoverStatus,
    });

  const handleDragStart = useCallback(
    (taskId, title, x, y, sourceStatus) => {
      startDrag(taskId, title, x, y, sourceStatus);
    },
    [startDrag]
  );



  const handleSave = (data) => {
    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, updates: data });
    } else {
      createTask.mutate(data);
    }
    setEditingTask(null);
  };



  const openCreate = () => {

    setEditingTask(null);

    setModalOpen(true);

  };



  const openEdit = (task) => {

    setEditingTask(task);

    setModalOpen(true);

  };



  return (

    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={KANBAN_SPRING}
      className="relative min-h-[calc(100vh-8rem)]"
    >

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">

        <div className="max-w-2xl">

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass">

            <ListTodo size={24} />

          </div>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-charcoal md:text-4xl">

            Tasks

          </h1>

          <p className="mt-3 text-sm leading-relaxed tracking-tight text-charcoal/50">

            {visibleTasks.length} tasks · drag cards between columns or reorder

            within a column

          </p>

        </div>

        <button type="button" onClick={openCreate} className="pill-btn-dark">

          <Plus size={18} /> New Task

        </button>

      </div>



      {batchingFilterTag && (

        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-gold/20 px-4 py-2 text-sm">

          <span>

            Batching filter: <strong>{batchingFilterTag}</strong>

          </span>

          <button

            type="button"

            className="pill-btn-ghost py-1 text-xs"

            onClick={() => setBatchingFilterTag(null)}

          >

            Clear filter

          </button>

        </div>

      )}



      <div className="kanban-board-grid grid gap-5 md:grid-cols-3">
          {KANBAN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={visibleTasks.filter((t) => t.status === status)}
              isHoverTarget={hoverStatus === status}
              draggingTaskId={draggingTaskId}
              onDragStart={handleDragStart}
              onEdit={openEdit}
              onDelete={(id) => deleteTask.mutate(id)}
            />
          ))}
        </div>

      {isDragging && session.taskTitle && (
        <KanbanDragGhost
          title={session.taskTitle}
          initialX={session.startX}
          initialY={session.startY}
          registerMover={registerGhostMover}
        />
      )}



      <TaskModal

        open={modalOpen}

        onClose={() => {

          setModalOpen(false);

          setEditingTask(null);

        }}

        onSave={handleSave}

        task={editingTask}

      />

    </motion.div>

  );

}


