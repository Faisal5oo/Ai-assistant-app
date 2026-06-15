"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RESEARCH_PIVOT_MS } from "@/lib/deepWorkConstants";

/**
 * Jarvis-style tab-return intercept for active deep work blocks.
 * Timer keeps running while hidden; overlay appears only on return.
 *
 * @param {Object} options
 * @param {boolean} options.enabled - active phase with running timer
 */
export function useDeepWorkTabIntercept({ enabled }) {
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const leftWhileRunningRef = useRef(false);
  const researchPivotUntilRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setShowReturnDialog(false);
      leftWhileRunningRef.current = false;
      researchPivotUntilRef.current = 0;
      return undefined;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        leftWhileRunningRef.current = true;
        return;
      }

      if (document.visibilityState !== "visible" || !leftWhileRunningRef.current) {
        return;
      }

      if (Date.now() < researchPivotUntilRef.current) {
        leftWhileRunningRef.current = false;
        return;
      }

      setShowReturnDialog(true);
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [enabled]);

  const resumeFocus = useCallback(() => {
    setShowReturnDialog(false);
    leftWhileRunningRef.current = false;
  }, []);

  const declareResearchPivot = useCallback(() => {
    setShowReturnDialog(false);
    leftWhileRunningRef.current = false;
    researchPivotUntilRef.current = Date.now() + RESEARCH_PIVOT_MS;
  }, []);

  return {
    showReturnDialog,
    resumeFocus,
    declareResearchPivot,
  };
}
