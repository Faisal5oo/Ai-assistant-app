"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

/**
 * Fixed bottom dock sheet — visible only on touch/mobile viewports (< md).
 *
 * Acts as the unified task source pool for drag operations on the Eisenhower
 * matrix, task-batching canvas, and Kanban board.
 *
 * Props:
 *   title        — label shown in the dock handle bar
 *   count        — badge count
 *   dropZoneAttr — { [data-attr]: value } spread onto the scrollable inner div
 *                  so existing drop resolvers (resolveDropZone) can find it
 *   children     — the draggable task chips / cards to render inside
 *   isHoverTarget — highlight when something is dragged over this zone
 *   emptyLabel   — text shown when count === 0
 */
export function MobileDockSheet({
  title,
  count = 0,
  dropZoneAttr = {},
  children,
  isHoverTarget = false,
  emptyLabel = "No tasks here",
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    /* Only visible below md breakpoint — hidden on desktop where the
       existing side/bottom panel layout is used instead. */
    <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 md:hidden">
      <motion.div
        className="pointer-events-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 32 }}
      >
        {/* Handle bar — always visible, tap to collapse/expand */}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-between gap-3 border-t border-white/20 bg-white/80 px-4 py-3 backdrop-blur-md"
          style={{
            background: isHoverTarget
              ? "rgba(245,217,126,0.18)"
              : undefined,
            borderTopColor: isHoverTarget
              ? "rgba(245,217,126,0.55)"
              : undefined,
          }}
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-semibold text-charcoal">
              {title}
            </span>
            <span className="rounded-full bg-charcoal/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-charcoal">
              {count}
            </span>
          </div>
          {collapsed ? (
            <ChevronUp size={16} className="text-charcoal/50" />
          ) : (
            <ChevronDown size={16} className="text-charcoal/50" />
          )}
        </button>

        {/* Scrollable content panel */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              key="dock-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
            >
              {/* Drop zone wrapper — carries the data attribute that the
                  existing resolveDropZone helpers look for */}
              <div
                {...dropZoneAttr}
                className="flex flex-col bg-white/75 p-3 backdrop-blur-md"
                style={{
                  height: "calc(32vh - 3rem)",
                  borderTop: isHoverTarget
                    ? "1px solid rgba(245,217,126,0.4)"
                    : "1px solid rgba(255,255,255,0.2)",
                  background: isHoverTarget
                    ? "rgba(245,217,126,0.10)"
                    : undefined,
                  transition: "background 180ms ease, border-color 180ms ease",
                }}
              >
                <div className="flex-1 overflow-y-auto overscroll-contain pr-1">
                  {count === 0 ? (
                    <p className="flex h-full items-center justify-center text-xs text-charcoal/40">
                      {emptyLabel}
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">{children}</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
