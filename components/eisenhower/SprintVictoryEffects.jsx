"use client";

import { motion } from "framer-motion";
import { EISENHOWER_MORPH_SPRING } from "@/lib/eisenhower";

const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i / 12) * Math.PI * 2,
  distance: 36 + (i % 3) * 14,
}));

/**
 * @param {Object} props
 * @param {'glow' | 'exit'} props.phase
 */
export function SprintVictoryEffects({ phase }) {
  if (phase === "glow") {
    return (
      <motion.div
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        aria-hidden
      >
        <motion.div
          className="absolute inset-0 bg-emerald-400/25"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0.35] }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-[-20%] rounded-full bg-emerald-300/30 blur-2xl"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1.4, opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.65, ease: "easeOut" }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-hidden rounded-2xl"
      initial={{ opacity: 1 }}
      aria-hidden
    >
      <motion.div
        className="absolute h-16 w-16 rounded-full border-2 border-emerald-400/60"
        initial={{ scale: 0.5, opacity: 0.9 }}
        animate={{ scale: 2.8, opacity: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-2 w-2 rounded-full"
          style={{
            background:
              p.id % 2 === 0
                ? "rgba(52, 211, 153, 0.95)"
                : "rgba(250, 204, 21, 0.9)",
          }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: [0, 1.2, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            ...EISENHOWER_MORPH_SPRING,
            delay: p.id * 0.02,
          }}
        />
      ))}
      <motion.span
        className="absolute text-2xl"
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, 1.35, 0.9], opacity: [0, 1, 0], rotate: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        ✓
      </motion.span>
    </motion.div>
  );
}
