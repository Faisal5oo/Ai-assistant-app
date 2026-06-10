"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";

/**
 * Matches EisenhowerDragGhost — fixed viewport ghost, imperative position updates.
 * @param {Object} props
 * @param {string | null} props.title
 * @param {number} props.initialX
 * @param {number} props.initialY
 * @param {(move: (x: number, y: number, rotate?: number) => void) => () => void} props.registerMover
 */
export function KanbanDragGhost({
  title,
  initialX,
  initialY,
  registerMover,
}) {
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const cardRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    const root = rootRef.current;
    const card = cardRef.current;
    if (!root || !card || !title) return undefined;

    const setPosition = (x, y, rotate = 0) => {
      root.style.left = `${x}px`;
      root.style.top = `${y}px`;
      card.style.transform = `translate(-50%, -50%) rotate(${rotate}deg) scale(1.04)`;
    };

    setPosition(initialX, initialY, 0);
    return registerMover(setPosition);
  }, [title, initialX, initialY, registerMover]);

  if (!title) return null;

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed z-[200] w-64 will-change-transform"
      style={{ left: initialX, top: initialY }}
    >
      <motion.div
        ref={cardRef}
        className="glass-card flex select-none touch-none items-center gap-2 border border-white/80 px-4 py-3.5 shadow-soft backdrop-blur-md will-change-transform"
        style={{
          transform: "translate(-50%, -50%) rotate(0deg) scale(1.04)",
        }}
      >
        <GripVertical
          size={14}
          strokeWidth={2.5}
          className="shrink-0 text-gold/70"
        />
        <span className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-charcoal">
          {title}
        </span>
      </motion.div>
    </div>
  );
}
