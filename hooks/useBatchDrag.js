"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POOL_ZONE_ID } from "@/lib/batchingConstants";

const DROP_ACTIVE_CLASS = "batch-drop-active";

/**
 * @typedef {Object} DragSession
 * @property {string | null} taskId
 * @property {string | null} taskTitle
 * @property {number} startX
 * @property {number} startY
 */

/**
 * Resolves drop target: bucket id or pool zone. Does not trigger React updates.
 * @param {number} clientX
 * @param {number} clientY
 * @returns {string | null}
 */
function resolveDropZone(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const pool = el.closest('[data-batch-drop="pool"]');
  if (pool) return POOL_ZONE_ID;

  const bucket = el.closest("[data-batch-bucket]");
  return bucket?.getAttribute("data-batch-bucket") ?? null;
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {HTMLElement | null}
 */
function resolveDropElement(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const pool = el.closest('[data-batch-drop="pool"]');
  if (pool) return /** @type {HTMLElement} */ (pool);

  const bucket = el.closest("[data-batch-bucket]");
  return bucket ? /** @type {HTMLElement} */ (bucket) : null;
}

/**
 * @param {Object} options
 * @param {(taskId: string, zoneId: string) => void} options.onDrop
 */
export function useBatchDrag({ onDrop }) {
  const [session, setSession] = useState(/** @type {DragSession} */ ({
    taskId: null,
    taskTitle: null,
    startX: 0,
    startY: 0,
  }));

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const highlightElRef = useRef(/** @type {HTMLElement | null} */ (null));
  const ghostMoveRef = useRef(/** @type {((x: number, y: number) => void) | null} */ (null));

  const clearHighlight = useCallback(() => {
    if (highlightElRef.current) {
      highlightElRef.current.classList.remove(DROP_ACTIVE_CLASS);
      highlightElRef.current = null;
    }
  }, []);

  const applyHighlight = useCallback(
    (clientX, clientY) => {
      const nextEl = resolveDropElement(clientX, clientY);
      if (highlightElRef.current === nextEl) return;

      clearHighlight();
      if (nextEl) {
        nextEl.classList.add(DROP_ACTIVE_CLASS);
        highlightElRef.current = nextEl;
      }
    },
    [clearHighlight]
  );

  const endDrag = useCallback(
    (clientX, clientY) => {
      const { taskId } = sessionRef.current;
      if (!taskId) return;

      const zoneId = resolveDropZone(clientX, clientY);
      if (zoneId) {
        onDrop(taskId, zoneId);
      }

      clearHighlight();
      document.body.classList.remove("batch-drag-active");
      ghostMoveRef.current = null;

      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
      });
    },
    [onDrop, clearHighlight]
  );

  const startDrag = useCallback((taskId, taskTitle, clientX, clientY) => {
    document.body.classList.add("batch-drag-active");
    setSession({
      taskId,
      taskTitle,
      startX: clientX,
      startY: clientY,
    });
  }, []);

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
      ghostMoveRef.current?.(e.clientX, e.clientY);
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
      document.body.classList.remove("batch-drag-active");
    };
  }, [session.taskId, endDrag, applyHighlight, clearHighlight]);

  return {
    session,
    isDragging: Boolean(session.taskId),
    draggingTaskId: session.taskId,
    startDrag,
    registerGhostMover,
    cancelDrag: () => {
      clearHighlight();
      document.body.classList.remove("batch-drag-active");
      ghostMoveRef.current = null;
      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
      });
    },
  };
}
