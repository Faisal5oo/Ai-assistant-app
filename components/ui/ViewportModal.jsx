"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const PANEL_SPRING = { type: "spring", stiffness: 300, damping: 28 };

/**
 * Viewport-centered modal shell — portaled to document.body for true center alignment.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.panelClassName]
 * @param {string} [props.ariaLabel]
 */
export function ViewportModal({
  open,
  onClose,
  children,
  panelClassName = "w-full max-w-lg rounded-4xl bg-cream-50 p-6 shadow-soft md:p-8",
  ariaLabel = "Dialog",
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="viewport-modal"
          /* Robust centering: fixed inset-0 + flex + safe-area padding
             prevents clipping on 14-inch laptops (HP EliteBook 845 G7,
             1920×1080 at 125% scale) and landscape-mode mobile viewports. */
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 py-safe"
          style={{ paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          {/* Backdrop — sits behind the panel but above page content */}
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 cursor-default bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            /* max-h + overflow-y-auto guarantees the panel never taller than
               the visible viewport, and scrolls internally if content overflows.
               margin:auto re-centers after the panel grows taller than the
               flex container on short displays. */
            className={`relative z-10 my-auto max-h-[calc(100dvh-2rem)] overflow-y-auto ${panelClassName}`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={PANEL_SPRING}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
