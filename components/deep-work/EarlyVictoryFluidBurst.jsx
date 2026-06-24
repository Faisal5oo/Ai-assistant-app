"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const FLUID_PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  angle: (i / 32) * Math.PI * 2,
  distance: 28 + (i % 8) * 14,
  size: 2 + (i % 3),
}));

/**
 * Premium gold fluid-burst for early objective achievement.
 * On mobile (<768px) renders a lightweight opacity + upward-fade crossfade
 * instead of the full vmax-scale burst to prevent clipping and layout jumps.
 * @param {Object} props
 * @param {boolean} props.active
 */
export function EarlyVictoryFluidBurst({ active }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!active) return null;

  if (isMobile) {
    return (
      <motion.div
        className="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.8, ease: "easeInOut", times: [0, 0.15, 0.7, 1] }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-[#14120e]/70 to-charcoal/90" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-gold/30 via-amber-300/15 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
        <motion.div
          className="relative z-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -8] }}
          transition={{ duration: 1.7, ease: "easeOut", times: [0, 0.15, 0.7, 1] }}
        >
          <div
            className="h-16 w-16 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(250,204,21,0.45) 0%, transparent 70%)",
              boxShadow: "0 0 32px rgba(250,204,21,0.4)",
            }}
          />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[120] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-charcoal/80 via-[#14120e]/70 to-charcoal/90"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.35] }}
        transition={{ duration: 1, ease: "easeOut" }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[min(90vw,520px)] w-[min(90vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold/60"
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.35, 1.6], opacity: [0, 0.9, 0] }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{
          boxShadow:
            "0 0 60px rgba(250,204,21,0.45), inset 0 0 40px rgba(250,204,21,0.15)",
        }}
      />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.4, 1.8], opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle, rgba(250,204,21,0.35) 0%, rgba(251,191,36,0.12) 40%, transparent 70%)",
        }}
      />

      {FLUID_PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 rounded-full bg-gradient-to-br from-gold via-amber-300 to-yellow-200"
          style={{ width: p.size, height: p.size }}
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance * 5,
            y: Math.sin(p.angle) * p.distance * 5,
            scale: [0, 2.2, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1,
            ease: [0.16, 1, 0.3, 1],
            delay: p.id * 0.012,
          }}
        />
      ))}

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.9, delay: 0.1 }}
        style={{
          background:
            "linear-gradient(100deg, transparent 20%, rgba(255,255,255,0.4) 48%, rgba(250,204,21,0.5) 52%, transparent 80%)",
          backgroundSize: "200% 100%",
        }}
      />
    </motion.div>
  );
}
