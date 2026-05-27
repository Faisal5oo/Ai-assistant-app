"use client";

import { useTimerTick } from "@/hooks/useTimerTick";
import { formatMsToTimer } from "@/lib/utils";

/**
 * Isolated timer display — only this subtree re-renders on tick.
 * @param {Object} props
 * @param {string} [props.className]
 */
export function SessionTimerText({ className = "" }) {
  const displayMs = useTimerTick();
  return (
    <span className={`tabular-nums ${className}`}>
      {formatMsToTimer(displayMs)}
    </span>
  );
}
