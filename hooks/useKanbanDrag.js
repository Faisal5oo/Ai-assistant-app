"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resolveDropIndex } from "@/lib/kanbanDragUtils";

const DROP_ACTIVE_CLASS = "kanban-drop-active";

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
 * @param {number} clientX
 * @param {number} clientY
 * @returns {HTMLElement | null}
 */
function resolveDropElement(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const zone = el.closest("[data-kanban-zone]");
  return zone ? /** @type {HTMLElement} */ (zone) : null;
}

/**
 * @typedef {Object} KanbanDragSession
 * @property {string | null} taskId
 * @property {string | null} taskTitle
 * @property {number} startX
 * @property {number} startY
 * @property {string | null} sourceStatus
 */

/**
 * Drag coordinates stay local; task order syncs only on drop (same as Eisenhower).
 * @param {Object} options
 * @param {(taskId: string, status: string, sourceStatus: string | null, dropIndex: number) => void} options.onDrop
 * @param {(status: string | null) => void} [options.onHoverStatus]
 */
export function useKanbanDrag({ onDrop, onHoverStatus }) {
  const [session, setSession] = useState(
    /** @type {KanbanDragSession} */ ({
      taskId: null,
      taskTitle: null,
      startX: 0,
      startY: 0,
      sourceStatus: null,
    })
  );

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const highlightElRef = useRef(/** @type {HTMLElement | null} */ (null));
  const ghostMoveRef = useRef(
    /** @type {((x: number, y: number, rotate?: number) => void) | null} */ (null)
  );
  const hoverStatusRef = useRef(/** @type {string | null} */ (null));
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const smoothedRotateRef = useRef(0);

  const clearHighlight = useCallback(() => {
    if (highlightElRef.current) {
      highlightElRef.current.classList.remove(DROP_ACTIVE_CLASS);
      highlightElRef.current = null;
    }
  }, []);

  const setHoverStatus = useCallback(
    (status) => {
      if (hoverStatusRef.current === status) return;
      hoverStatusRef.current = status;
      onHoverStatus?.(status);
    },
    [onHoverStatus]
  );

  const applyHighlight = useCallback(
    (clientX, clientY) => {
      const status = resolveDropZone(clientX, clientY);
      setHoverStatus(status);

      const nextEl = resolveDropElement(clientX, clientY);
      if (highlightElRef.current === nextEl) return;

      clearHighlight();
      if (nextEl) {
        nextEl.classList.add(DROP_ACTIVE_CLASS);
        highlightElRef.current = nextEl;
      }
    },
    [clearHighlight, setHoverStatus]
  );

  const endDrag = useCallback(
    (clientX, clientY) => {
      const { taskId, sourceStatus } = sessionRef.current;
      if (!taskId) return;

      const status = resolveDropZone(clientX, clientY);
      if (status) {
        const dropIndex = resolveDropIndex(
          clientX,
          clientY,
          status,
          taskId
        );
        onDrop(taskId, status, sourceStatus, dropIndex);
      }

      clearHighlight();
      setHoverStatus(null);
      document.body.classList.remove("kanban-drag-active");
      ghostMoveRef.current = null;

      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
        sourceStatus: null,
      });
    },
    [onDrop, clearHighlight, setHoverStatus]
  );

  const startDrag = useCallback(
    (taskId, taskTitle, clientX, clientY, sourceStatus = null) => {
      lastPointerRef.current = { x: clientX, y: clientY };
      smoothedRotateRef.current = 0;
      document.body.classList.add("kanban-drag-active");
      setSession({
        taskId,
        taskTitle,
        startX: clientX,
        startY: clientY,
        sourceStatus,
      });
    },
    []
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

      const targetRotate = Math.max(-14, Math.min(14, dx * 0.65));
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
      clearHighlight();
      setHoverStatus(null);
      document.body.classList.remove("kanban-drag-active");
    };
  }, [session.taskId, endDrag, applyHighlight, clearHighlight, setHoverStatus]);

  return {
    session,
    isDragging: Boolean(session.taskId),
    draggingTaskId: session.taskId,
    startDrag,
    registerGhostMover,
    cancelDrag: () => {
      clearHighlight();
      setHoverStatus(null);
      document.body.classList.remove("kanban-drag-active");
      ghostMoveRef.current = null;
      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
        sourceStatus: null,
      });
    },
  };
}
