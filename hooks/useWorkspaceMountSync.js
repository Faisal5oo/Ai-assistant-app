"use client";

import { useEffect, useRef } from "react";
import { fetchActiveWorkspace } from "@/lib/workspaceSync";

/**
 * @typedef {'deep-work' | 'pomodoro' | 'batching' | 'time-blocking'} WorkspaceTechnique
 */

/**
 * @typedef {Object} WorkspaceMountHandlers
 * @property {(workspace: import('@/lib/workspaceSync').ActiveWorkspace) => void | Promise<void>} [onDeepWork]
 * @property {(workspace: import('@/lib/workspaceSync').ActiveWorkspace) => void | Promise<void>} [onPomodoro]
 * @property {(workspace: import('@/lib/workspaceSync').ActiveWorkspace) => void | Promise<void>} [onBatching]
 * @property {(workspace: import('@/lib/workspaceSync').ActiveWorkspace) => void | Promise<void>} [onTimeBlocking]
 */

/**
 * On mount, verifies local state against the server workspace snapshot and
 * invokes the technique handler to apply authoritative remote state.
 *
 * @param {WorkspaceTechnique} technique
 * @param {WorkspaceMountHandlers} handlers
 */
export function useWorkspaceMountSync(technique, handlers) {
  const verifiedRef = useRef(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (verifiedRef.current) return undefined;
    verifiedRef.current = true;

    let cancelled = false;

    const verify = async () => {
      try {
        const workspace = await fetchActiveWorkspace();
        if (cancelled) return;

        const h = handlersRef.current;
        switch (technique) {
          case "deep-work":
            await h.onDeepWork?.(workspace);
            break;
          case "pomodoro":
            await h.onPomodoro?.(workspace);
            break;
          case "batching":
            await h.onBatching?.(workspace);
            break;
          case "time-blocking":
            await h.onTimeBlocking?.(workspace);
            break;
          default:
            break;
        }
      } catch {
        /* offline / unauthenticated */
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [technique]);
}
