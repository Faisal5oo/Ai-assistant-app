"use client";

import { useEffect, useState } from "react";

/**
 * Local wall-clock — does not touch Zustand.
 * @param {number} [intervalMs=60000]
 */
export function useCurrentClock(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
