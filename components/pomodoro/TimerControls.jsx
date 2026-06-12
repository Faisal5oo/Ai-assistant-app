"use client";

import { motion } from "framer-motion";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

const SPRING = { type: "spring", stiffness: 380, damping: 22 };

function PillButton({ onClick, children, variant = "ghost", className = "" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, boxShadow: "0 6px 28px rgba(0,0,0,0.10)" }}
      whileTap={{ scale: 0.95 }}
      transition={SPRING}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
        variant === "gold"
          ? "bg-gold text-charcoal hover:bg-gold-dark shadow-[0_2px_18px_rgba(250,204,21,0.30)]"
          : "pill-btn-ghost",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </motion.button>
  );
}

/**
 * @param {Object} props
 * @param {boolean} props.isRunning
 * @param {() => void} props.onStart
 * @param {() => void} props.onPause
 * @param {() => void} props.onReset
 * @param {() => void} props.onSkip
 */
export function TimerControls({ isRunning, onStart, onPause, onReset, onSkip }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <PillButton
        variant="gold"
        onClick={isRunning ? onPause : onStart}
        className="min-w-[148px]"
      >
        {isRunning ? (
          <><Pause size={16} strokeWidth={2.5} />Pause</>
        ) : (
          <><Play size={16} strokeWidth={2.5} />Start Focus</>
        )}
      </PillButton>

      <PillButton onClick={onSkip}>
        <SkipForward size={14} strokeWidth={2} />
        Skip
      </PillButton>

      <PillButton onClick={onReset}>
        <RotateCcw size={14} strokeWidth={2} />
        Reset
      </PillButton>
    </div>
  );
}
