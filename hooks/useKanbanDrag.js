"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveDropIndex } from "@/lib/kanbanDragUtils";

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {string | null}
 */
function resolveDropZone(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const zone = el.closest("[data-kanban-zone]");
  return zone?.getAttribute("data-kanban-zone") ?? null;
}

/**
 * @typedef {Object} KanbanDragSession
 * @property {string | null} taskId
 * @property {string | null} taskTitle
 * @property {number} startX
 * @property {number} startY
 * @property {string | null} sourceStatus
 * @property {number} sourceIndex
 */

/**
 * @typedef {Object} KanbanHoverInsert
 * @property {string | null} status
 * @property {number | null} index
 */

/**
 * @param {Object} options
 * @param {(taskId: string, status: string, sourceStatus: string | null, dropIndex: number) => void} options.onDrop
 * @param {(status: string | null) => void} [options.onHoverStatus]
 * @param {(insert: KanbanHoverInsert) => void} [options.onHoverInsert]
 */
export function useKanbanDrag({ onDrop, onHoverStatus, onHoverInsert }) {
  const [session, setSession] = useState(
    /** @type {KanbanDragSession} */ ({
      taskId: null,
      taskTitle: null,
      startX: 0,
      startY: 0,
      sourceStatus: null,
      sourceIndex: 0,
    })
  );

  const [hoverInsert, setHoverInsertState] = useState(
    /** @type {KanbanHoverInsert} */ ({ status: null, index: null })
  );

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const ghostMoveRef = useRef(
    /** @type {((x: number, y: number, rotate?: number) => void) | null} */ (null)
  );
  const hoverStatusRef = useRef(/** @type {string | null} */ (null));
  const hoverInsertRef = useRef(/** @type {KanbanHoverInsert} */ ({
    status: null,
    index: null,
  }));
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const smoothedRotateRef = useRef(0);

  const setHoverStatus = useCallback(
    (status) => {
      if (hoverStatusRef.current === status) return;
      hoverStatusRef.current = status;
      onHoverStatus?.(status);
    },
    [onHoverStatus]
  );

  const updateHoverInsert = useCallback(
    (insert) => {
      if (
        hoverInsertRef.current.status === insert.status &&
        hoverInsertRef.current.index === insert.index
      ) {
        return;
      }
      hoverInsertRef.current = insert;
      setHoverInsertState(insert);
      onHoverInsert?.(insert);
    },
    [onHoverInsert]
  );

  const applyHighlight = useCallback(
    (clientX, clientY) => {
      const status = resolveDropZone(clientX, clientY);
      setHoverStatus(status);

      const taskId = sessionRef.current.taskId;
      const index =
        status != null
          ? resolveDropIndex(clientX, clientY, status, taskId)
          : null;

      updateHoverInsert({ status, index });
    },
    [setHoverStatus, updateHoverInsert]
  );

  const resetDragUi = useCallback(() => {
    setHoverStatus(null);
    updateHoverInsert({ status: null, index: null });
    document.body.classList.remove("kanban-drag-active");
    ghostMoveRef.current = null;
  }, [setHoverStatus, updateHoverInsert]);

  const endDrag = useCallback(
    (clientX, clientY) => {
      const { taskId, sourceStatus } = sessionRef.current;
      if (!taskId) return;

      const status = resolveDropZone(clientX, clientY);
      const dropIndex = resolveDropIndex(
        clientX,
        clientY,
        status,
        taskId
      );

      if (status) {
        onDrop(taskId, status, sourceStatus, dropIndex);
      }

      resetDragUi();

      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
        sourceStatus: null,
        sourceIndex: 0,
      });
    },
    [onDrop, resetDragUi]
  );

  const startDrag = useCallback(
    (
      taskId,
      taskTitle,
      clientX,
      clientY,
      sourceStatus = null,
      sourceIndex = 0
    ) => {
      lastPointerRef.current = { x: clientX, y: clientY };
      smoothedRotateRef.current = 0;
      document.body.classList.add("kanban-drag-active");

      hoverStatusRef.current = sourceStatus;
      onHoverStatus?.(sourceStatus);
      const initialInsert = { status: sourceStatus, index: sourceIndex };
      hoverInsertRef.current = initialInsert;
      setHoverInsertState(initialInsert);
      onHoverInsert?.(initialInsert);

      setSession({
        taskId,
        taskTitle,
        startX: clientX,
        startY: clientY,
        sourceStatus,
        sourceIndex,
      });
    },
    [onHoverStatus, onHoverInsert]
  );

  const registerGhostMover = useCallback((fn) => {
    ghostMoveRef.current = fn;
    return () => {
      if (ghostMoveRef.current === fn) {
        ghostMoveRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!session.taskId) return undefined;

    const onMove = (e) => {
      const dx = e.clientX - lastPointerRef.current.x;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };

      const targetRotate = Math.max(-12, Math.min(12, dx * 0.65));
      smoothedRotateRef.current +=
        (targetRotate - smoothedRotateRef.current) * 0.35;

      ghostMoveRef.current?.(
        e.clientX,
        e.clientY,
        smoothedRotateRef.current
      );
      applyHighlight(e.clientX, e.clientY);
    };

    const onUp = (e) => {
      endDrag(e.clientX, e.clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      resetDragUi();
    };
  }, [session.taskId, endDrag, applyHighlight, resetDragUi]);

  return {
    session,
    hoverInsert,
    isDragging: Boolean(session.taskId),
    draggingTaskId: session.taskId,
    startDrag,
    registerGhostMover,
    cancelDrag: () => {
      resetDragUi();
      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
        sourceStatus: null,
        sourceIndex: 0,
      });
    },
  };
}
