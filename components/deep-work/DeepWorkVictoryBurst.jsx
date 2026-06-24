"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  angle: (i / 18) * Math.PI * 2 + 0.12,
  distance: 36 + (i % 6) * 12,
}));

/**
 * Dark-and-gold deep work task completion celebration.
 * On mobile (<768px) renders a lightweight opacity crossfade instead of the
 * full particle burst to avoid layout jumps and clipping on narrow viewports.
 * @param {Object} props
 * @param {boolean} props.active
 */
export function DeepWorkVictoryBurst({ active }) {
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
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.6, ease: "easeInOut", times: [0, 0.2, 0.7, 1] }}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-charcoal/85 via-[#1a1814]/75 to-charcoal/90" />
        <div className="absolute inset-0 bg-gradient-to-tr from-gold/35 via-amber-300/20 to-transparent" />
        <motion.p
          className="relative z-10 font-display text-2xl font-semibold tracking-tight text-gold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -6] }}
          transition={{ duration: 1.5, ease: "easeOut", times: [0, 0.2, 0.7, 1] }}
        >
          Breakthrough secured
        </motion.p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-charcoal/90 via-[#1a1814]/80 to-charcoal/95"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.95, 0.4] }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-gold/45 via-amber-300/30 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.3] }}
        transition={{ duration: 0.85, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[120vmax] w-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/25 blur-3xl"
        initial={{ scale: 0.15, opacity: 0 }}
        animate={{ scale: 1.6, opacity: [0, 0.95, 0] }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-gold shadow-[0_0_10px_rgba(250,204,21,0.9)]"
          initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos(p.angle) * p.distance * 4,
            y: Math.sin(p.angle) * p.distance * 4,
            scale: [0, 1.8, 0],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 0.85,
            ease: [0.22, 1, 0.36, 1],
            delay: p.id * 0.018,
          }}
        />
      ))}
      <motion.p
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-2xl font-semibold tracking-tight text-gold md:text-3xl"
        initial={{ opacity: 0, y: 12, scale: 0.9 }}
        animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -8], scale: [0.9, 1, 1, 1.05] }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        Breakthrough secured
      </motion.p>
    </motion.div>
  );
}
