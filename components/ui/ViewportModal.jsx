"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const PANEL_SPRING = { type: "spring", stiffness: 240, damping: 30 };

const LAYOUTS = {
  center: {
    shell:
      "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 py-safe",
    panel:
      "relative z-10 my-auto w-full max-h-[calc(100dvh-2rem)] overflow-y-auto",
    defaultPanelClass:
      "max-w-lg rounded-4xl bg-cream-50 p-6 shadow-soft md:p-8",
  },
  adaptive: {
    shell:
      "fixed inset-0 z-50 flex items-end justify-center overflow-hidden md:items-center md:overflow-y-auto md:p-4 md:py-safe",
    panel:
      "relative z-10 flex w-full max-w-full flex-col overflow-hidden m-0 h-auto max-h-[85dvh] rounded-t-2xl bg-cream-50 shadow-soft fixed bottom-0 left-0 right-0 md:static md:my-auto md:max-h-[90vh] md:max-w-2xl md:rounded-2xl",
    defaultPanelClass: "",
  },
};

/**
 * Viewport-centered modal shell — portaled to document.body.
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.panelClassName]
 * @param {string} [props.ariaLabel]
 * @param {boolean} [props.closeOnBackdropClick]
 * @param {"center"|"adaptive"} [props.layout]
 */
export function ViewportModal({
  open,
  onClose,
  children,
  panelClassName,
  ariaLabel = "Dialog",
  closeOnBackdropClick = true,
  layout = "center",
}) {
  const [mounted, setMounted] = useState(false);
  const layoutConfig = LAYOUTS[layout] ?? LAYOUTS.center;
  const resolvedPanelClassName =
    panelClassName ??
    (layout === "center" ? layoutConfig.defaultPanelClass : layoutConfig.defaultPanelClass);

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

  const backdropClassName =
    "fixed inset-0 cursor-default bg-black/40 backdrop-blur-sm";

  return createPortal(
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="viewport-modal"
          className={layoutConfig.shell}
          style={
            layout === "adaptive"
              ? undefined
              : {
                  paddingTop: "max(1rem, env(safe-area-inset-top))",
                  paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
                }
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
        >
          {closeOnBackdropClick ? (
            <motion.button
              type="button"
              aria-label="Close dialog"
              className={backdropClassName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
          ) : (
            <motion.div
              aria-hidden
              className={backdropClassName}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={`${layoutConfig.panel} ${resolvedPanelClassName}`.trim()}
            initial={
              layout === "adaptive"
                ? { y: "100%", opacity: 0 }
                : { scale: 0.95, opacity: 0 }
            }
            animate={
              layout === "adaptive" ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }
            }
            exit={
              layout === "adaptive"
                ? { y: "100%", opacity: 0 }
                : { scale: 0.95, opacity: 0 }
            }
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
