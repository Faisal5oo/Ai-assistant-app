"use client";

import { motion } from "framer-motion";
import { EISENHOWER_SPRING } from "@/lib/eisenhower";

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  angle: (i / 8) * Math.PI * 2,
}));

/**
 * @param {Object} props
 * @param {() => void} props.onComplete
 */
export function PurgeExitAnimation({ onComplete }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
      onAnimationComplete={onComplete}
    >
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute h-1.5 w-1.5 rounded-full bg-charcoal/35"
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * 48,
            y: Math.sin(p.angle) * 48,
            scale: 0,
            opacity: 0,
          }}
          transition={{ ...EISENHOWER_SPRING, duration: 0.4 }}
        />
      ))}
      <motion.div
        className="absolute inset-2 rounded-2xl border border-charcoal/10 bg-white/40"
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 0.6, opacity: 0 }}
        transition={EISENHOWER_SPRING}
      />
    </motion.div>
  );
}
