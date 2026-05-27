"use client";



import { useCallback, useState } from "react";

import { motion } from "framer-motion";

import { ListTodo, Plus } from "lucide-react";

import { useTaskStore } from "@/store/useTaskStore";

import { KANBAN_SPRING, KANBAN_STATUSES } from "@/lib/kanban";

import { useKanbanDrag } from "@/hooks/useKanbanDrag";

import { KanbanColumn } from "./KanbanColumn";

import { KanbanDragGhost } from "./KanbanDragGhost";

import { TaskModal } from "./TaskModal";



export function KanbanBoard() {

  const tasks = useTaskStore((s) => s.tasks);

  const batchingFilterTag = useTaskStore((s) => s.batchingFilterTag);

  const setBatchingFilterTag = useTaskStore((s) => s.setBatchingFilterTag);

  const addTask = useTaskStore((s) => s.addTask);

  const updateTask = useTaskStore((s) => s.updateTask);

  const deleteTask = useTaskStore((s) => s.deleteTask);

  const reorderTasks = useTaskStore((s) => s.reorderTasks);

  const moveTaskToIndex = useTaskStore((s) => s.moveTaskToIndex);



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

        reorderTasks(

          /** @type {import('@/types/interfaces').TaskStatus} */ (status),

          startIndex,

          endIndex

        );

        return;

      }



      const clamped = Math.max(0, Math.min(dropIndex, columnTasks.length));

      moveTaskToIndex(

        taskId,

        /** @type {import('@/types/interfaces').TaskStatus} */ (status),

        clamped

      );

    },

    [visibleTasks, reorderTasks, moveTaskToIndex]

  );



  const { session, draggingTaskId, hoverInsert, startDrag, registerGhostMover } =

    useKanbanDrag({

      onDrop: handleDrop,

      onHoverStatus: setHoverStatus,

    });



  const handleDragStart = useCallback(

    (taskId, title, x, y, sourceStatus) => {
      const sourceIndex = visibleTasks
        .filter((t) => t.status === sourceStatus)
        .findIndex((t) => t.id === taskId);
      startDrag(
        taskId,
        title,
        x,
        y,
        sourceStatus,
        sourceIndex < 0 ? 0 : sourceIndex
      );
    },

    [startDrag, visibleTasks]

  );



  const handleSave = (data) => {

    if (editingTask) {

      updateTask(editingTask.id, data);

    } else {

      addTask(data);

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



      <div className="grid gap-5 md:grid-cols-3">

        {KANBAN_STATUSES.map((status) => (

          <KanbanColumn

            key={status}

            status={status}

            tasks={visibleTasks.filter((t) => t.status === status)}

            isHoverTarget={hoverStatus === status}

            draggingTaskId={draggingTaskId}

            sourceStatus={session.sourceStatus}

            sourceIndex={session.sourceIndex}

            hoverInsert={hoverInsert}

            onDragStart={handleDragStart}

            onEdit={openEdit}

            onDelete={deleteTask}

          />

        ))}

      </div>



      <KanbanDragGhost

        title={session.taskTitle}

        initialX={session.startX}

        initialY={session.startY}

        registerMover={registerGhostMover}

      />



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


