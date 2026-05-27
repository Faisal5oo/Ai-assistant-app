"use client";

import { useEffect, useRef } from "react";
import { GripVertical } from "lucide-react";

/**
 * Isolated drag ghost — position updates imperatively (no parent re-renders on move).
 * @param {Object} props
 * @param {string | null} props.title
 * @param {number} props.initialX
 * @param {number} props.initialY
 * @param {(move: (x: number, y: number) => void) => () => void} props.registerMover
 */
export function DragGhost({ title, initialX, initialY, registerMover }) {
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const el = rootRef.current;
    if (!el || !title) return undefined;

    const setPosition = (x, y) => {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    };

    setPosition(initialX, initialY);
    return registerMover(setPosition);
  }, [title, initialX, initialY, registerMover]);

  if (!title) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed z-[200] w-56 -translate-x-1/2 -translate-y-1/2"
      style={{ left: initialX, top: initialY }}
    >
      <div className="flex scale-105 items-center gap-2 rounded-2xl border border-gold/40 bg-white px-4 py-3 shadow-soft">
        <GripVertical size={14} className="text-gold-dark" />
        <span className="line-clamp-1 text-sm font-semibold text-charcoal">{title}</span>
      </div>
    </div>
  );
}
