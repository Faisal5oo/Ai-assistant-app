"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const CHECK_SPRING = {
  type: "spring",
  stiffness: 520,
  damping: 28,
  mass: 0.6,
};

/**
 * @param {Object} props
 * @param {boolean} props.checked
 * @param {() => void} props.onToggle
 * @param {boolean} [props.disabled]
 * @param {string} [props.label]
 */
export function AnimatedTaskCheckbox({
  checked,
  onToggle,
  disabled = false,
  label = "Toggle task",
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={label}
      aria-pressed={checked}
      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
      whileTap={{ scale: 0.88 }}
      transition={CHECK_SPRING}
    >
      <motion.span
        className="absolute inset-0 rounded-full border-2"
        animate={{
          borderColor: checked ? "rgba(250, 204, 21, 1)" : "rgba(255, 255, 255, 0.3)",
          backgroundColor: checked ? "rgba(250, 204, 21, 1)" : "rgba(255, 255, 255, 0.04)",
          boxShadow: checked
            ? "0 0 0 4px rgba(250, 204, 21, 0.2), 0 4px 14px rgba(250, 204, 21, 0.35)"
            : "0 0 0 0px rgba(250, 204, 21, 0)",
        }}
        transition={CHECK_SPRING}
      />

      <motion.span
        className="absolute inset-0 rounded-full bg-gold/30"
        initial={false}
        animate={{
          scale: checked ? [1, 1.45, 1] : 0,
          opacity: checked ? [0.6, 0, 0] : 0,
        }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />

      <motion.span
        className="relative z-10 flex items-center justify-center text-charcoal"
        initial={false}
        animate={{
          scale: checked ? 1 : 0,
          opacity: checked ? 1 : 0,
          rotate: checked ? 0 : -45,
        }}
        transition={CHECK_SPRING}
      >
        <Check size={15} strokeWidth={3} />
      </motion.span>
    </motion.button>
  );
}
