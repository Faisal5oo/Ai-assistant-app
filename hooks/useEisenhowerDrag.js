"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EISENHOWER_INBOX_ZONE } from "@/lib/eisenhower";

const DROP_ACTIVE_CLASS = "eisenhower-drop-active";

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {string | null}
 */
function resolveDropZone(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const purge = el.closest('[data-eisenhower-purge="true"]');
  if (purge) return "purge";

  const zone = el.closest("[data-eisenhower-zone]");
  return zone?.getAttribute("data-eisenhower-zone") ?? null;
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @returns {HTMLElement | null}
 */
function resolveDropElement(clientX, clientY) {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return null;

  const purge = el.closest('[data-eisenhower-purge="true"]');
  if (purge) return /** @type {HTMLElement} */ (purge);

  const zone = el.closest("[data-eisenhower-zone]");
  return zone ? /** @type {HTMLElement} */ (zone) : null;
}

/**
 * @typedef {Object} EisenhowerDragSession
 * @property {string | null} taskId
 * @property {string | null} taskTitle
 * @property {number} startX
 * @property {number} startY
 * @property {string | null} sourceZone
 */

/**
 * Drag coordinates stay local; Zustand syncs only on drop.
 * @param {Object} options
 * @param {(taskId: string, zoneId: string, sourceZone: string | null) => void} options.onDrop
 * @param {(zoneId: string | null) => void} [options.onHoverZone]
 */
export function useEisenhowerDrag({ onDrop, onHoverZone }) {
  const [session, setSession] = useState(
    /** @type {EisenhowerDragSession} */ ({
      taskId: null,
      taskTitle: null,
      startX: 0,
      startY: 0,
      sourceZone: null,
    })
  );

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const highlightElRef = useRef(/** @type {HTMLElement | null} */ (null));
  const ghostMoveRef = useRef(
    /** @type {((x: number, y: number, rotate?: number) => void) | null} */ (null)
  );
  const hoverZoneRef = useRef(/** @type {string | null} */ (null));
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const smoothedRotateRef = useRef(0);

  const clearHighlight = useCallback(() => {
    if (highlightElRef.current) {
      highlightElRef.current.classList.remove(DROP_ACTIVE_CLASS);
      highlightElRef.current = null;
    }
  }, []);

  const setHoverZone = useCallback(
    (zoneId) => {
      if (hoverZoneRef.current === zoneId) return;
      hoverZoneRef.current = zoneId;
      onHoverZone?.(zoneId);
    },
    [onHoverZone]
  );

  const applyHighlight = useCallback(
    (clientX, clientY) => {
      const zoneId = resolveDropZone(clientX, clientY);
      setHoverZone(zoneId);

      const nextEl = resolveDropElement(clientX, clientY);
      if (highlightElRef.current === nextEl) return;

      clearHighlight();
      if (nextEl) {
        nextEl.classList.add(DROP_ACTIVE_CLASS);
        highlightElRef.current = nextEl;
      }
    },
    [clearHighlight, setHoverZone]
  );

  const endDrag = useCallback(
    (clientX, clientY) => {
      const { taskId, sourceZone } = sessionRef.current;
      if (!taskId) return;

      const zoneId = resolveDropZone(clientX, clientY);
      if (zoneId) {
        onDrop(taskId, zoneId, sourceZone);
      }

      clearHighlight();
      setHoverZone(null);
      document.body.classList.remove("eisenhower-drag-active");
      document.body.style.touchAction = "";
      document.documentElement.style.overscrollBehavior = "";
      ghostMoveRef.current = null;

      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
        sourceZone: null,
      });
    },
    [onDrop, clearHighlight, setHoverZone]
  );

  const startDrag = useCallback(
    (taskId, taskTitle, clientX, clientY, sourceZone = null) => {
      lastPointerRef.current = { x: clientX, y: clientY };
      smoothedRotateRef.current = 0;
      document.body.classList.add("eisenhower-drag-active");
      /* Prevent native touch scroll while dragging on mobile */
      document.body.style.touchAction = "none";
      document.documentElement.style.overscrollBehavior = "none";
      setSession({
        taskId,
        taskTitle,
        startX: clientX,
        startY: clientY,
        sourceZone: sourceZone ?? EISENHOWER_INBOX_ZONE,
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
      setHoverZone(null);
      document.body.classList.remove("eisenhower-drag-active");
      document.body.style.touchAction = "";
      document.documentElement.style.overscrollBehavior = "";
    };
  }, [session.taskId, endDrag, applyHighlight, clearHighlight, setHoverZone]);

  return {
    session,
    isDragging: Boolean(session.taskId),
    draggingTaskId: session.taskId,
    startDrag,
    registerGhostMover,
    cancelDrag: () => {
      clearHighlight();
      setHoverZone(null);
      document.body.classList.remove("eisenhower-drag-active");
      document.body.style.touchAction = "";
      document.documentElement.style.overscrollBehavior = "";
      ghostMoveRef.current = null;
      setSession({
        taskId: null,
        taskTitle: null,
        startX: 0,
        startY: 0,
        sourceZone: null,
      });
    },
  };
}
