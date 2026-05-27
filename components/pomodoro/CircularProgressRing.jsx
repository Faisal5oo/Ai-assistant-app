"use client";

import { motion } from "framer-motion";

const SIZE = 280;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/**
 * @param {Object} props
 * @param {number} props.progress 0–1
 * @param {string} props.timeLabel
 * @param {string} props.phaseLabel
 */
export function CircularProgressRing({ progress, timeLabel, phaseLabel }) {
  const offset = C * (1 - Math.min(1, Math.max(0, progress)));

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="rgba(26,26,26,0.08)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="#FACC15"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.p
          key={timeLabel}
          initial={{ opacity: 0.6, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-display text-5xl font-semibold tabular-nums tracking-tight"
        >
          {timeLabel}
        </motion.p>
        <p className="mt-1 text-sm font-medium uppercase tracking-widest text-charcoal/45">
          {phaseLabel}
        </p>
      </div>
    </div>
  );
}
