"use client";

import { useTimerTick } from "@/hooks/useTimerTick";

/** Keeps the focus timer ticking on every route without rendering UI. */
export function GlobalTimerTick() {
  useTimerTick();
  return null;
}
