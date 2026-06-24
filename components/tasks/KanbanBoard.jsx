"use client";



import { useCallback, useState } from "react";

import { motion } from "framer-motion";

import { ListTodo, Plus } from "lucide-react";

import { useTaskStore } from "@/store/useTaskStore";
import { useTasks, useArchivedTasks } from "@/hooks/queries/useTasksQuery";
import { useConfirmDeleteTask } from "@/hooks/useConfirmDeleteTask";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useReorderTasksMutation,
} from "@/hooks/queries/useTaskMutations";

import { KANBAN_SPRING, KANBAN_STATUSES } from "@/lib/kanban";

import { useKanbanDrag } from "@/hooks/useKanbanDrag";
import { useViewportEdgeScroll } from "@/hooks/useViewportEdgeScroll";

import { KanbanColumn } from "./KanbanColumn";

import { KanbanDragGhost } from "./KanbanDragGhost";

import { DeleteTaskConfirmModal } from "./DeleteTaskConfirmModal";
import { TaskModal } from "./TaskModal";



export function KanbanBoard() {

  const { tasks } = useTasks();
  const { archivedTasks, isLoading: archivedLoading } = useArchivedTasks();
  const batchingFilterTag = useTaskStore((s) => s.batchingFilterTag);
  const setBatchingFilterTag = useTaskStore((s) => s.setBatchingFilterTag);
  const createTask = useCreateTaskMutation();
  const updateTask = useUpdateTaskMutation();
  const reorderTasksMutation = useReorderTasksMutation();
  const {
    deleteTarget,
    requestDelete,
    cancelDelete,
    confirmDelete,
    isDeleting,
  } = useConfirmDeleteTask();



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

  const visibleArchivedTasks = batchingFilterTag
    ? archivedTasks.filter((t) =>
        t.tags.some(
          (tg) => tg.toLowerCase() === batchingFilterTag.toLowerCase()
        )
      )
    : archivedTasks;

  const visibleTaskCount = visibleTasks.length + visibleArchivedTasks.length;



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
        const without = sourceTasks.filter((t) => t.id !== taskId);
        const endIndex = Math.max(0, Math.min(dropIndex, without.length));
        if (endIndex === startIndex) return;

        const nextColumn = [...without];
        nextColumn.splice(endIndex, 0, sourceTasks[startIndex]);
        syncColumn(status, nextColumn);
        return;
      }

      const without = visibleTasks.filter((t) => t.id !== taskId);
      const task = visibleTasks.find((t) => t.id === taskId);
      if (!task) return;

      const column = without.filter((t) => t.status === status);
      const clamped = Math.max(0, Math.min(dropIndex, column.length));
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

  useViewportEdgeScroll({ isDragging });

  const handleDragStart = useCallback(
    (taskId, title, x, y, sourceStatus) => {
      startDrag(taskId, title, x, y, sourceStatus);
    },
    [startDrag]
  );



  const closeTaskModal = useCallback(() => {
    setModalOpen(false);
    setEditingTask(null);
  }, []);

  const handleSave = (data) => {
    if (editingTask) {
      updateTask.mutate(
        { id: editingTask.id, updates: data },
        { onSuccess: closeTaskModal }
      );
      return;
    }
    createTask.mutate(data, { onSuccess: closeTaskModal });
  };

  const handleRequestDelete = useCallback(
    (id) => {
      const task = visibleTasks.find((t) => t.id === id);
      if (task) requestDelete(task);
    },
    [visibleTasks, requestDelete]
  );



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

      <div className="mb-5 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">

        <div className="max-w-2xl">

          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/30 text-charcoal shadow-glass sm:h-12 sm:w-12">

            <ListTodo size={20} className="sm:hidden" />
            <ListTodo size={24} className="hidden sm:block" />

          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl md:text-4xl">

            Tasks

          </h1>

          <p className="mt-2 text-xs leading-relaxed tracking-tight text-charcoal/50 sm:mt-3 sm:text-sm">

            {visibleTaskCount} tasks · drag cards between columns or reorder

            within a column

          </p>

        </div>

        <button type="button" onClick={openCreate} className="pill-btn-dark w-full sm:w-auto">

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



      {/* Mobile: single-column full-width stacked; md+: 3-column grid */}
      <div className="kanban-board-grid grid gap-5 grid-cols-1 md:grid-cols-3">
          {KANBAN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={visibleTasks.filter((t) => t.status === status)}
              archivedTasks={
                status === "Completed" ? visibleArchivedTasks : undefined
              }
              archivedLoading={status === "Completed" ? archivedLoading : false}
              isHoverTarget={hoverStatus === status}
              draggingTaskId={draggingTaskId}
              onDragStart={handleDragStart}
              onEdit={openEdit}
              onDelete={handleRequestDelete}
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
        onClose={closeTaskModal}
        onSave={handleSave}
        task={editingTask}
        isSaving={createTask.isPending || updateTask.isPending}
      />

      <DeleteTaskConfirmModal
        open={Boolean(deleteTarget)}
        task={deleteTarget}
        isDeleting={isDeleting}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
      />

    </motion.div>

  );

}


